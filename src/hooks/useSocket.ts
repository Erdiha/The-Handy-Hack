// /hooks/useSocket.ts - Clean hook without 'any' types
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  SocketMessage,
  OnlineUser,
  TypingIndicator
} from '@/types/socket';

// Hook configuration interface
interface UseSocketConfig {
  onNewMessage?: (message: SocketMessage) => void;
  onMessageUpdate?: (tempId: string, message: SocketMessage) => void;
  onUserOnline?: (user: OnlineUser) => void;
  onUserOffline?: (data: { userId: string; timestamp: Date }) => void;
}

// Hook return interface
interface UseSocketReturn {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  connectionError: string | null;
  onlineUsers: string[];
  typingUsers: TypingIndicator[];
  sendMessage: (conversationId: string, content: string) => string;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  reconnect: () => void;
}

export const useSocket = (config: UseSocketConfig = {}): UseSocketReturn => {
  const { data: session } = useSession();
  const {
    onNewMessage,
    onMessageUpdate,
    onUserOnline,
    onUserOffline,
  } = config;

  // State with proper typing
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  // Refs with proper typing
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!session?.user?.id || socketRef.current) return;

    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketUrl, {
      path: '/api/socket',
      addTrailingSlash: false,
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
      
      // Authenticate immediately
      if (session.user.id && session.user.name) {
        socket.emit('authenticate', {
          userId: session.user.id,
          userName: session.user.name
        });
      }
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error);
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
    });

    // User presence handlers
    socket.on('online_users', (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on('user_online', (data: OnlineUser) => {
      setOnlineUsers(prev => {
        const filtered = prev.filter(id => id !== data.userId);
        return [...filtered, data.userId];
      });
      
      if (onUserOnline) {
        onUserOnline(data);
      }
    });

    socket.on('user_offline', (data: { userId: string; timestamp: Date }) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      
      if (onUserOffline) {
        onUserOffline(data);
      }
    });

    // Message handlers
    socket.on('new_message', (message: SocketMessage) => {
      console.log('💬 Received message:', {
        id: message.id,
        tempId: message.tempId,
        from: message.senderName
      });
      
      // Handle message confirmation (has tempId)
      if (message.tempId && onMessageUpdate) {
        onMessageUpdate(message.tempId, message);
      } 
      // Handle new incoming message (no tempId)
      else if (onNewMessage) {
        onNewMessage(message);
      }
    });

    socket.on('message_error', (data: { tempId: string; error: string }) => {
      console.error('❌ Message error:', data);
      setConnectionError(`Message failed: ${data.error}`);
      
      // Clear error after 3 seconds
      setTimeout(() => setConnectionError(null), 3000);
    });

    // Typing handlers
    socket.on('user_started_typing', (data: TypingIndicator) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => 
          !(user.userId === data.userId && user.conversationId === data.conversationId)
        );
        return [...filtered, data];
      });
    });

    socket.on('user_stopped_typing', (data: { userId: string; conversationId: string }) => {
      setTypingUsers(prev => 
        prev.filter(user => 
          !(user.userId === data.userId && user.conversationId === data.conversationId)
        )
      );
    });

  }, [session, onNewMessage, onMessageUpdate, onUserOnline, onUserOffline]);

  // Cleanup function
  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('🧹 Cleaning up socket...');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      socketRef.current.disconnect();
      socketRef.current = null;
      
      setIsConnected(false);
      setConnectionError(null);
      setOnlineUsers([]);
      setTypingUsers([]);
    }
  }, []);

  // Initialize/cleanup effect
  useEffect(() => {
    initializeSocket();
    return cleanupSocket;
  }, [initializeSocket, cleanupSocket]);

  // Send message function with proper tempId generation
  const sendMessage = useCallback((conversationId: string, content: string): string => {
    if (!socketRef.current || !isConnected || !session?.user) {
      console.warn('⚠️ Cannot send message: not connected');
      return '';
    }

    if (!content.trim()) {
      console.warn('⚠️ Cannot send empty message');
      return '';
    }

    // Generate unique tempId
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📤 Sending message with tempId:', tempId);
    
    socketRef.current.emit('send_message', {
      conversationId,
      content: content.trim(),
      tempId, // ✅ Always include tempId
      senderName: session.user.name || 'You'
    });

    return tempId;
  }, [isConnected, session?.user]);

  // Other socket functions
  const joinConversation = useCallback((conversationId: string) => {
    if (!socketRef.current || !isConnected) return;
    
    console.log('🏠 Joining conversation:', conversationId);
    socketRef.current.emit('join_conversation', conversationId);
  }, [isConnected]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (!socketRef.current || !isConnected) return;
    
    console.log('🚪 Leaving conversation:', conversationId);
    socketRef.current.emit('leave_conversation', conversationId);
  }, [isConnected]);

  const startTyping = useCallback((conversationId: string) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('typing_start', { conversationId });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 3000);
  }, [isConnected]);

  const stopTyping = useCallback((conversationId: string) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('typing_stop', { conversationId });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isConnected]);

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnection...');
    cleanupSocket();
    setTimeout(initializeSocket, 1000);
  }, [cleanupSocket, initializeSocket]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    onlineUsers,
    typingUsers,
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    reconnect
  };
};