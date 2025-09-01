// server.ts - Bug-Free Socket.io Implementation with TypeScript
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server, Socket } from "socket.io";

// Type definitions
interface ConnectedUser {
  socketId: string;
  userName: string;
  timestamp: Date;
}

interface UserSocket {
  userId: string;
  userName: string;
}

interface MessageData {
  conversationId: string;
  content: string;
  tempId?: string;
  senderName: string;
}

interface TypingData {
  conversationId: string;
}

interface AuthData {
  userId: string;
  userName: string;
}

// Extend Socket interface
declare module "socket.io" {
  interface Socket {
    userId?: string;
    userName?: string;
  }
}

// Global io declaration
declare global {
  var io: Server | undefined;
}

const dev = process.env.NODE_ENV !== "production";
const hostname =
  process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Track connected users and their socket IDs
const connectedUsers = new Map<string, ConnectedUser>(); // userId -> ConnectedUser
const userSockets = new Map<string, UserSocket>(); // socketId -> UserSocket
const conversationTyping = new Map<string, Set<string>>(); // conversationId -> Set<userId>

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    await handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    //  faster disconnect detection:
    pingTimeout: 10000, // 10 seconds instead of default 60s
    pingInterval: 5000, // Check every 5 seconds
  });
  global.io = io;

  io.on("connection", (socket: Socket) => {
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

        // Type-safe assignment
        socket.userId = String(userId); // Ensure it's a string
        socket.userName = String(userName);

        userSockets.set(socket.id, {
          userId: String(userId),
          userName: String(userName),
        });

        // Join user-specific room for notifications
        const userRoom = `user-${userId}`;
        socket.join(userRoom);

        // Update connected users tracking
        connectedUsers.set(String(userId), {
          socketId: socket.id,
          userName: String(userName),
          timestamp: new Date(),
        });

        console.log(`✅ User authenticated: ${userName} (${userId})`);
        console.log(`🏠 Joined user room: ${userRoom}`);

        // Broadcast user online status
        socket.broadcast.emit("user_online", {
          userId: String(userId),
          userName: String(userName),
          timestamp: new Date(),
        });

        // Send current online users list
        socket.emit("online_users", Array.from(connectedUsers.keys()));
      } catch (error) {
        console.error("💥 Authentication error:", error);
      }
    });

    // === CONVERSATION ROOM MANAGEMENT ===
    socket.on("join_conversation", (conversationId: string) => {
      try {
        if (!socket.userId) {
          console.error("❌ User not authenticated, cannot join conversation");
          socket.emit("error", { message: "Authentication required" });
          return;
        }

        if (!conversationId) {
          console.error("❌ No conversation ID provided");
          return;
        }

        const conversationRoom = `conversation-${conversationId}`;
        socket.join(conversationRoom);

        console.log(
          `💬 ${socket.userName} joined conversation: ${conversationId}`
        );

        // Clear any typing indicators for this user in this conversation
        const typingSet = conversationTyping.get(conversationId);
        if (typingSet) {
          typingSet.delete(socket.userId);
          if (typingSet.size === 0) {
            conversationTyping.delete(conversationId);
          }
        }

        socket.emit("conversation_joined", { conversationId });
      } catch (error) {
        console.error("💥 Join conversation error:", error);
      }
    });

    socket.on("leave_conversation", (conversationId: string) => {
      try {
        if (!socket.userId || !conversationId) return;

        const conversationRoom = `conversation-${conversationId}`;
        socket.leave(conversationRoom);

        console.log(
          `👋 ${socket.userName} left conversation: ${conversationId}`
        );

        // Clear typing indicators
        const typingSet = conversationTyping.get(conversationId);
        if (typingSet) {
          typingSet.delete(socket.userId);

          // Broadcast typing update
          socket.to(conversationRoom).emit("user_stopped_typing", {
            userId: socket.userId,
            conversationId: conversationId,
          });

          if (typingSet.size === 0) {
            conversationTyping.delete(conversationId);
          }
        }

        socket.emit("conversation_left", { conversationId });
      } catch (error) {
        console.error("💥 Leave conversation error:", error);
      }
    });

    // === MESSAGE HANDLING ===
    socket.on("send_message", (data: MessageData) => {
      try {
        if (!socket.userId || !socket.userName) {
          console.error("❌ Unauthenticated message attempt");
          socket.emit("error", { message: "Authentication required" });
          return;
        }

        const { conversationId, content, tempId, senderName } = data;

        if (!conversationId || !content) {
          console.error("❌ Invalid message data:", data);
          socket.emit("error", { message: "Invalid message data" });
          return;
        }

        console.log(
          `📨 Message from ${socket.userName} to conversation ${conversationId}`
        );

        const conversationRoom = `conversation-${conversationId}`;
        const timestamp = new Date();

        // Broadcast message to conversation room (for real-time chat)
        socket.to(conversationRoom).emit("new_message", {
          id: `temp-${Date.now()}-${socket.id}`,
          conversationId: conversationId,
          senderId: socket.userId,
          senderName: socket.userName,
          content: content,
          timestamp: timestamp.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          isRead: false,
          tempId: tempId,
        });

        // Send notification to users not in the conversation
        socket.broadcast.emit("notification_update", {
          type: "new_message",
          conversationId: conversationId,
          fromUserId: socket.userId,
          fromUserName: socket.userName,
          timestamp: timestamp,
        });

        console.log(
          `🔔 Notification broadcasted for conversation: ${conversationId}`
        );

        // Clear typing indicator for sender
        const typingSet = conversationTyping.get(conversationId);
        if (typingSet && typingSet.has(socket.userId)) {
          typingSet.delete(socket.userId);
          socket.to(conversationRoom).emit("user_stopped_typing", {
            userId: socket.userId,
            conversationId: conversationId,
          });
        }

        // Confirm message sent
        socket.emit("message_sent", { tempId, conversationId });
      } catch (error) {
        console.error("💥 Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // === TYPING INDICATORS ===
    socket.on("typing_start", (data: TypingData) => {
      try {
        if (!socket.userId || !data.conversationId) return;

        const { conversationId } = data;
        const conversationRoom = `conversation-${conversationId}`;

        if (!conversationTyping.has(conversationId)) {
          conversationTyping.set(conversationId, new Set());
        }

        const typingSet = conversationTyping.get(conversationId)!;
        typingSet.add(socket.userId);

        socket.to(conversationRoom).emit("user_started_typing", {
          userId: socket.userId,
          userName: socket.userName,
          conversationId: conversationId,
        });
      } catch (error) {
        console.error("💥 Typing start error:", error);
      }
    });

    socket.on("typing_stop", (data: TypingData) => {
      try {
        if (!socket.userId || !data.conversationId) return;

        const { conversationId } = data;
        const conversationRoom = `conversation-${conversationId}`;
        const typingSet = conversationTyping.get(conversationId);

        if (typingSet) {
          typingSet.delete(socket.userId);

          socket.to(conversationRoom).emit("user_stopped_typing", {
            userId: socket.userId,
            conversationId: conversationId,
          });

          if (typingSet.size === 0) {
            conversationTyping.delete(conversationId);
          }
        }
      } catch (error) {
        console.error("💥 Typing stop error:", error);
      }
    });

    socket.on("disconnect", (reason) => {
      try {
        console.log(`🔌 User disconnected: ${socket.id}, reason: ${reason}`);

        // Add type guards to fix TypeScript errors
        if (socket.userId && socket.userName) {
          const userId = socket.userId; // Now TypeScript knows it's not undefined
          const userName = socket.userName;

          // IMMEDIATE cleanup
          connectedUsers.delete(userId);
          userSockets.delete(socket.id);

          // Clean up typing indicators immediately
          conversationTyping.forEach((typingSet, conversationId) => {
            if (typingSet.has(userId)) {
              typingSet.delete(userId);

              // Broadcast typing stopped immediately
              socket.broadcast
                .to(`conversation-${conversationId}`)
                .emit("user_stopped_typing", {
                  userId: userId,
                  conversationId: conversationId,
                });

              if (typingSet.size === 0) {
                conversationTyping.delete(conversationId);
              }
            }
          });

          // IMMEDIATE offline broadcast
          socket.broadcast.emit("user_offline", {
            userId: userId,
            timestamp: new Date(),
          });

          // Update all clients with new online users list immediately
          socket.broadcast.emit(
            "online_users",
            Array.from(connectedUsers.keys())
          );

          console.log(
            `👋 Cleaned up user: ${userName} (${userId}) - IMMEDIATE`
          );
        } else {
          console.log(`🔌 Unauthenticated user disconnected: ${socket.id}`);
        }
      } catch (error) {
        console.error("💥 Disconnect cleanup error:", error);
      }
    });

    // === HEALTH CHECK ===
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date() });
    });
  });

  server
    .listen(port, () => {
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
      console.log(`🔌 Socket.io server initialized`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    })
    .on("error", (err: Error) => {
      console.error("❌ Server failed to start:", err);
      process.exit(1);
    });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  global.io?.close(() => {
    console.log("✅ Socket.io server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  global.io?.close(() => {
    console.log("✅ Socket.io server closed");
    process.exit(0);
  });
});
