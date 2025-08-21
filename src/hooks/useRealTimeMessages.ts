// Replace: src/hooks/useRealTimeMessages.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketMessage,
} from "@/types/socket";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  conversationId: string;
}

interface UseRealTimeConfig {
  conversationId: string | null;
  onNewMessage?: (message: Message) => void;
  enabled?: boolean;
}

export const useRealTimeMessages = ({
  conversationId,
  onNewMessage,
  enabled = true,
}: UseRealTimeConfig) => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<
    Array<{
      userId: string;
      userName: string;
      conversationId: string;
    }>
  >([]);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !session?.user) return;

    const socketInstance = io({
      path: "/socket.io",
    });

    socketInstance.on("connect", () => {
      console.log("Connected to Socket.io server");
      setIsConnected(true);

      // Authenticate user
      socketInstance.emit("authenticate", {
        userId: session.user.id,
        userName: session.user.name,
      });
      console.log("📤 Sending authenticate event:", {
        userId: session.user.id,
        userName: session.user.name,
      }); // ADD THIS LINE
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from Socket.io server");
      setIsConnected(false);
    });

    // Handle new messages
    socketInstance.on("new_message", (socketMessage: SocketMessage) => {
      if (onNewMessage) {
        const message: Message = {
          id: socketMessage.id,
          senderId: socketMessage.senderId,
          senderName: socketMessage.senderName,
          content: socketMessage.content,
          timestamp: socketMessage.timestamp,
          isRead: socketMessage.isRead,
          conversationId: socketMessage.conversationId,
        };
        onNewMessage(message);
      }
    });

    // Handle online users
    socketInstance.on("online_users", (userIds: string[]) => {
      setOnlineUsers(userIds);
    });

    socketInstance.on("user_online", (data) => {
      setOnlineUsers((prev) => [
        ...prev.filter((id) => id !== data.userId),
        data.userId,
      ]);
    });

    socketInstance.on("user_offline", (data) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    // Handle typing indicators
    socketInstance.on("user_started_typing", (data) => {
      setTypingUsers((prev) => [
        ...prev.filter(
          (user) =>
            !(
              user.userId === data.userId &&
              user.conversationId === data.conversationId
            )
        ),
        data,
      ]);
    });

    socketInstance.on("user_stopped_typing", (data) => {
      setTypingUsers((prev) =>
        prev.filter(
          (user) =>
            !(
              user.userId === data.userId &&
              user.conversationId === data.conversationId
            )
        )
      );
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [enabled, session?.user, onNewMessage]);

  // Join/leave conversations
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("join_conversation", conversationId);

    return () => {
      socket.emit("leave_conversation", conversationId);
    };
  }, [socket, conversationId]);

  // Socket.io functions
  const sendMessage = useCallback(
    (conversationId: string, content: string): string => {
      if (!socket) return "";

      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      socket.emit("send_message", {
        conversationId,
        content,
        tempId,
        senderName: session?.user?.name || "You",
      });

      return tempId;
    },
    [socket, session?.user?.name]
  );

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (socket) {
        socket.emit("join_conversation", conversationId);
      }
    },
    [socket]
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (socket) {
        socket.emit("leave_conversation", conversationId);
      }
    },
    [socket]
  );

  const startTyping = useCallback(
    (conversationId: string) => {
      if (socket) {
        socket.emit("typing_start", { conversationId });
      }
    },
    [socket]
  );

  const stopTyping = useCallback(
    (conversationId: string) => {
      if (socket) {
        socket.emit("typing_stop", { conversationId });
      }
    },
    [socket]
  );

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    startPolling: () => {}, // For backward compatibility
    stopPolling: () => {}, // For backward compatibility
  };
};
