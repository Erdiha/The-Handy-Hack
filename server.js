// server.js - Create this file in your root directory
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const onlineUsers = new Map(); // userId -> { userName, timestamp }
const typingUsers = new Map(); // conversationId -> Set<{ userId, userName }>

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  // Initialize Socket.io with your types
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("👤 User connected:", socket.id);
    console.log("🔧 Setting up event listeners for socket:", socket.id);

    socket.on("authenticate", (data) => {
      console.log("🎯 AUTHENTICATE EVENT TRIGGERED for socket:", socket.id); // ADD THIS LINE
      console.log("🔍 RAW authenticate event received:", JSON.stringify(data));
      console.log("🔐 Data type:", typeof data);
      console.log("🔐 Data keys:", data ? Object.keys(data) : "no keys");

      if (data && data.userId && data.userName) {
        socket.userId = data.userId;
        socket.userName = data.userName;

        console.log(
          "✅ User authenticated successfully:",
          socket.userId,
          socket.userName
        );

        // Rest of your existing authenticate code...
        onlineUsers.set(data.userId, {
          userId: data.userId,
          userName: data.userName,
          timestamp: new Date(),
        });

        socket.broadcast.emit("user_online", {
          userId: data.userId,
          userName: data.userName,
          timestamp: new Date(),
        });

        socket.emit("online_users", Array.from(onlineUsers.keys()));
      } else {
        console.log("❌ Invalid authenticate data received:", data);
      }
    });

    // Join conversation
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
      console.log(
        `User ${socket.userName} joined conversation: ${conversationId}`
      );
    });

    // Leave conversation
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
      // Remove from typing if they were typing
      socket.emit("typing_stop", { conversationId });
    });

    // Send message
    socket.on("send_message", (data) => {
      // Broadcast to conversation room
      socket.to(data.conversationId).emit("new_message", {
        id: `temp-${Date.now()}`, // Temporary until saved to DB
        conversationId: data.conversationId,
        senderId: socket.userId,
        senderName: data.senderName,
        content: data.content,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        isRead: false,
        tempId: data.tempId,
      });
    });

    // Typing indicators
    socket.on("typing_start", (data) => {
      if (!typingUsers.has(data.conversationId)) {
        typingUsers.set(data.conversationId, new Set());
      }
      typingUsers.get(data.conversationId).add({
        userId: socket.userId,
        userName: socket.userName,
      });

      socket.to(data.conversationId).emit("user_started_typing", {
        userId: socket.userId,
        userName: socket.userName,
        conversationId: data.conversationId,
      });
    });

    socket.on("typing_stop", (data) => {
      if (typingUsers.has(data.conversationId)) {
        const users = typingUsers.get(data.conversationId);
        users.forEach((user) => {
          if (user.userId === socket.userId) {
            users.delete(user);
          }
        });
      }

      socket.to(data.conversationId).emit("user_stopped_typing", {
        userId: socket.userId,
        conversationId: data.conversationId,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        socket.broadcast.emit("user_offline", {
          userId: socket.userId,
          timestamp: new Date(),
        });
      }
      console.log("User disconnected:", socket.id);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
