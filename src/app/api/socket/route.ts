// /pages/api/socket.ts - Clean server without 'any' types
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { 
  NextApiResponseServerIO,
  CustomSocket,
  SocketMessage,
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
} from '@/types/socket';

// In-memory stores with proper typing
const activeUsers = new Map<string, string>(); // userId -> socketId
const userSockets = new Map<string, string>(); // socketId -> userId
const typingUsers = new Map<string, Set<string>>(); // conversationId -> Set of userIds
const userNames = new Map<string, string>(); // userId -> userName

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('✅ Socket.io already running');
    res.end();
    return;
  }

  console.log('🚀 Starting Socket.io server...');
  
  const io = new ServerIO<ClientToServerEvents, ServerToClientEvents, never, SocketData>(
    res.socket.server,
    {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    }
  );

  io.on('connection', (socket: CustomSocket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Authentication - properly typed
    socket.on('authenticate', (data: { userId: string; userName: string }) => {
      socket.userId = data.userId;
      socket.userName = data.userName;
      
      activeUsers.set(data.userId, socket.id);
      userSockets.set(socket.id, data.userId);
      userNames.set(data.userId, data.userName);

      socket.join(`user_${data.userId}`);
      
      const onlineUserIds = Array.from(activeUsers.keys());
      socket.emit('online_users', onlineUserIds);
      
      socket.broadcast.emit('user_online', { 
        userId: data.userId,
        userName: data.userName,
        timestamp: new Date()
      });

      console.log(`✅ User authenticated: ${data.userName}`);
    });

    // Join conversation - properly typed
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`🏠 User ${socket.userId} joined conversation: ${conversationId}`);
    });

    // Leave conversation - properly typed
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`);
      
      if (typingUsers.has(conversationId) && socket.userId) {
        typingUsers.get(conversationId)?.delete(socket.userId);
        if (typingUsers.get(conversationId)?.size === 0) {
          typingUsers.delete(conversationId);
        }
      }
      
      console.log(`🚪 User ${socket.userId} left conversation: ${conversationId}`);
    });

    // Send message - properly typed with tempId
    socket.on('send_message', (data: {
      conversationId: string;
      content: string;
      tempId: string; // ✅ Required, not optional
      senderName: string;
    }) => {
      if (!socket.userId) {
        socket.emit('message_error', { 
          tempId: data.tempId, 
          error: 'Not authenticated' 
        });
        return;
      }

      // Clear typing indicator
      if (typingUsers.has(data.conversationId)) {
        typingUsers.get(data.conversationId)?.delete(socket.userId);
      }

      // Create properly typed message
      const message: SocketMessage = {
        id: `msg_${Date.now()}_${socket.id.substring(0, 8)}`,
        conversationId: data.conversationId,
        senderId: socket.userId,
        senderName: data.senderName,
        content: data.content.trim(),
        timestamp: new Date().toISOString(),
        isRead: false,
        tempId: data.tempId // ✅ Include tempId for confirmation
      };

      // Broadcast to conversation
      io.to(`conversation_${data.conversationId}`).emit('new_message', message);
      
      console.log(`✅ Message sent with tempId: ${data.tempId}`);
    });

    // Typing indicators - properly typed
    socket.on('typing_start', (data: { conversationId: string }) => {
      if (!socket.userId || !socket.userName) return;

      if (!typingUsers.has(data.conversationId)) {
        typingUsers.set(data.conversationId, new Set());
      }
      typingUsers.get(data.conversationId)?.add(socket.userId);

      socket.to(`conversation_${data.conversationId}`).emit('user_started_typing', {
        userId: socket.userId,
        userName: socket.userName,
        conversationId: data.conversationId
      });
    });

    socket.on('typing_stop', (data: { conversationId: string }) => {
      if (!socket.userId) return;

      if (typingUsers.has(data.conversationId)) {
        typingUsers.get(data.conversationId)?.delete(socket.userId);
        if (typingUsers.get(data.conversationId)?.size === 0) {
          typingUsers.delete(data.conversationId);
        }
      }

      socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        conversationId: data.conversationId
      });
    });

    // Disconnect - properly typed
    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}`);
      
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        userSockets.delete(socket.id);
        userNames.delete(socket.userId);

        // Clean up typing indicators
        for (const [conversationId, users] of typingUsers.entries()) {
          if (users.has(socket.userId)) {
            users.delete(socket.userId);
            socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
              userId: socket.userId,
              conversationId
            });
          }
          if (users.size === 0) {
            typingUsers.delete(conversationId);
          }
        }

        socket.broadcast.emit('user_offline', { 
          userId: socket.userId,
          timestamp: new Date()
        });
      }
    });
  });

  res.socket.server.io = io;
  console.log('✅ Socket.io server initialized');
  res.end();
};

export default SocketHandler;