// server.js - Bug-Free Socket.io Implementation
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Track connected users and their socket IDs
const connectedUsers = new Map(); // userId -> { socketId, userName, timestamp }
const userSockets = new Map(); // socketId -> { userId, userName }
const conversationTyping = new Map(); // conversationId -> Set<{ userId, userName }>

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  // Initialize Socket.io with proper configuration
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // === USER AUTHENTICATION & ROOM JOINING ===
    socket.on("authenticate", (data) => {
      try {
        console.log("🔐 Authentication attempt:", data);

        if (!data || !data.userId || !data.userName) {
          console.error("❌ Invalid authentication data:", data);
          return;
        }

        const { userId, userName } = data;

        // Store user mapping
        socket.userId = userId;
        socket.userName = userName;
        userSockets.set(socket.id, { userId, userName });

        // Join user-specific room for notifications
        const userRoom = `user-${userId}`;
        socket.join(userRoom);

        // Update connected users tracking
        connectedUsers.set(userId, {
          socketId: socket.id,
          userName: userName,
          timestamp: new Date(),
        });

        console.log(`✅ User authenticated: ${userName} (${userId})`);
        console.log(`📍 Joined user room: ${userRoom}`);

        // Broadcast user online status
        socket.broadcast.emit("user_online", {
          userId: userId,
          userName: userName,
          timestamp: new Date(),
        });

        // Send current online users list
        socket.emit("online_users", Array.from(connectedUsers.keys()));
      } catch (error) {
        console.error("💥 Authentication error:", error);
      }
    });

    // === CONVERSATION ROOM MANAGEMENT ===
    socket.on("join_conversation", (conversationId) => {
      try {
        if (!socket.userId) {
          console.error("❌ User not authenticated, cannot join conversation");
          return;
        }

        const conversationRoom = `conversation-${conversationId}`;
        socket.join(conversationRoom);

        console.log(
          `💬 ${socket.userName} joined conversation: ${conversationId}`
        );

        // Clear any typing indicators for this user in this conversation
        const typingKey = `${conversationId}`;
        if (conversationTyping.has(typingKey)) {
          const typingSet = conversationTyping.get(typingKey);
          typingSet.delete(socket.userId);
          if (typingSet.size === 0) {
            conversationTyping.delete(typingKey);
          }
        }
      } catch (error) {
        console.error("💥 Join conversation error:", error);
      }
    });

    socket.on("leave_conversation", (conversationId) => {
      try {
        if (!socket.userId) return;

        const conversationRoom = `conversation-${conversationId}`;
        socket.leave(conversationRoom);

        console.log(
          `👋 ${socket.userName} left conversation: ${conversationId}`
        );

        // Clear typing indicators
        const typingKey = `${conversationId}`;
        if (conversationTyping.has(typingKey)) {
          const typingSet = conversationTyping.get(typingKey);
          typingSet.delete(socket.userId);

          // Broadcast typing update
          socket.to(conversationRoom).emit("user_stopped_typing", {
            userId: socket.userId,
            conversationId: conversationId,
          });

          if (typingSet.size === 0) {
            conversationTyping.delete(typingKey);
          }
        }
      } catch (error) {
        console.error("💥 Leave conversation error:", error);
      }
    });

    // === MESSAGE HANDLING ===
    socket.on("send_message", (data) => {
      try {
        if (!socket.userId || !socket.userName) {
          console.error("❌ Unauthenticated message attempt");
          return;
        }

        const { conversationId, content, tempId, senderName } = data;

        if (!conversationId || !content) {
          console.error("❌ Invalid message data:", data);
          return;
        }

        console.log(
          `📨 Message from ${socket.userName} to conversation ${conversationId}`
        );

        const conversationRoom = `conversation-${conversationId}`;

        // Broadcast message to conversation room (for real-time chat)
        socket.to(conversationRoom).emit("new_message", {
          id: `temp-${Date.now()}-${socket.id}`,
          conversationId: conversationId,
          senderId: socket.userId,
          senderName: socket.userName,
          content: content,
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          isRead: false,
          tempId: tempId,
        });

        socket.broadcast.emit("notification_update", {
          type: "new_message",
          conversationId: conversationId,
          fromUserId: socket.userId,
          fromUserName: socket.userName,
        });

        console.log(
          `🔔 Notification broadcasted for conversation: ${conversationId}`
        );
        // Clear typing indicator for sender
        const typingKey = `${conversationId}`;
        if (conversationTyping.has(typingKey)) {
          const typingSet = conversationTyping.get(typingKey);
          typingSet.delete(socket.userId);

          socket.to(conversationRoom).emit("user_stopped_typing", {
            userId: socket.userId,
            conversationId: conversationId,
          });
        }
      } catch (error) {
        console.error("💥 Send message error:", error);
      }
    });

    // === TYPING INDICATORS ===
    socket.on("typing_start", (data) => {
      try {
        if (!socket.userId || !data.conversationId) return;

        const { conversationId } = data;
        const typingKey = `${conversationId}`;
        const conversationRoom = `conversation-${conversationId}`;

        if (!conversationTyping.has(typingKey)) {
          conversationTyping.set(typingKey, new Set());
        }

        conversationTyping.get(typingKey).add(socket.userId);

        socket.to(conversationRoom).emit("user_started_typing", {
          userId: socket.userId,
          userName: socket.userName,
          conversationId: conversationId,
        });
      } catch (error) {
        console.error("💥 Typing start error:", error);
      }
    });

    socket.on("typing_stop", (data) => {
      try {
        if (!socket.userId || !data.conversationId) return;

        const { conversationId } = data;
        const typingKey = `${conversationId}`;
        const conversationRoom = `conversation-${conversationId}`;

        if (conversationTyping.has(typingKey)) {
          conversationTyping.get(typingKey).delete(socket.userId);

          socket.to(conversationRoom).emit("user_stopped_typing", {
            userId: socket.userId,
            conversationId: conversationId,
          });
        }
      } catch (error) {
        console.error("💥 Typing stop error:", error);
      }
    });

    // === DISCONNECT HANDLING ===
    socket.on("disconnect", () => {
      try {
        console.log(`🔌 User disconnected: ${socket.id}`);

        if (socket.userId) {
          // Clean up user tracking
          connectedUsers.delete(socket.userId);
          userSockets.delete(socket.id);

          // Clean up typing indicators
          conversationTyping.forEach((typingSet, conversationId) => {
            if (typingSet.has(socket.userId)) {
              typingSet.delete(socket.userId);

              // Broadcast typing stopped
              socket.broadcast
                .to(`conversation-${conversationId}`)
                .emit("user_stopped_typing", {
                  userId: socket.userId,
                  conversationId: conversationId,
                });

              if (typingSet.size === 0) {
                conversationTyping.delete(conversationId);
              }
            }
          });

          // Broadcast user offline
          socket.broadcast.emit("user_offline", {
            userId: socket.userId,
            timestamp: new Date(),
          });

          console.log(
            `👋 Cleaned up user: ${socket.userName} (${socket.userId})`
          );
        }
      } catch (error) {
        console.error("💥 Disconnect cleanup error:", error);
      }
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Server ready on http://${hostname}:${port}`);
    console.log(`🔌 Socket.io server initialized`);
  });
});
