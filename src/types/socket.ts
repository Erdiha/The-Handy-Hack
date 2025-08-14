// /types/socket.ts - Clean types without 'any'
import { NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Server as ServerIO, Socket } from 'socket.io';

// Message interface with tempId properly declared
export interface SocketMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  tempId?: string; // ✅ Properly declared as optional
}

// User online status
export interface OnlineUser {
  userId: string;
  userName: string;
  timestamp: Date;
}

// Typing indicator
export interface TypingIndicator {
  userId: string;
  userName: string;
  conversationId: string;
}

// Server to Client Events
export interface ServerToClientEvents {
  new_message: (message: SocketMessage) => void;
  message_error: (data: { tempId: string; error: string }) => void;
  user_online: (data: OnlineUser) => void;
  user_offline: (data: { userId: string; timestamp: Date }) => void;
  online_users: (userIds: string[]) => void;
  user_started_typing: (data: TypingIndicator) => void;
  user_stopped_typing: (data: { userId: string; conversationId: string }) => void;
}

// Client to Server Events
export interface ClientToServerEvents {
  authenticate: (data: { userId: string; userName: string }) => void;
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  send_message: (data: {
    conversationId: string;
    content: string;
    tempId: string; // ✅ Required field
    senderName: string;
  }) => void;
  typing_start: (data: { conversationId: string }) => void;
  typing_stop: (data: { conversationId: string }) => void;
}

// Socket data
export interface SocketData {
  userId?: string;
  userName?: string;
}

// Extended Socket with proper typing
export interface CustomSocket extends Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData> {
  userId?: string;
  userName?: string;
}

// Properly typed API response
export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
    };
  };
};