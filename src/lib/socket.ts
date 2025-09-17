import { io, Socket } from "socket.io-client";

export interface SocketMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  tempId?: string;
}

class SocketManager {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return this.socket;

    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to socket server:", this.socket?.id);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  joinConversation(conversationId: string) {
    this.socket?.emit("join_conversation", conversationId);
  }

  sendMessage(messageData: SocketMessage) {
    this.socket?.emit("send_message", messageData);
  }

  onNewMessage(callback: (message: SocketMessage) => void) {
    this.socket?.on("new_message", callback);
  }
}

export const socketManager = new SocketManager();
export const getSocket = () => socketManager.getSocket();
