// Updated: src/hooks/useRealTimeMessages.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Socket } from "socket.io-client";

// Extend Window interface for global socket
declare global {
  interface Window {
    globalSocket?: Socket;
  }
}

interface SocketMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface UserData {
  userId: string;
  userName: string;
  timestamp?: Date;
}

interface TypingData {
  userId: string;
  userName: string;
  conversationId: string;
}

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
  const { setActiveConversation } = useNotifications();

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<
    Array<{
      userId: string;
      userName: string;
      conversationId: string;
    }>
  >([]);

  // Get global socket from window (set by NotificationContext)
  const getGlobalSocket = useCallback((): Socket | null => {
    return window.globalSocket || null;
  }, []);

  // Set up message event listeners when conversation changes
  useEffect(() => {
    if (!enabled || !session?.user || !conversationId) return;

    const socket = getGlobalSocket();
    if (!socket) {
      console.log("⚠️ [MESSAGES] Waiting for global socket...");
      return;
    }

    console.log(
      "📡 [MESSAGES] Setting up message listeners for conversation:",
      conversationId
    );

    // Set active conversation for notification suppression
    setActiveConversation(conversationId);

    // Handle new messages
    const handleNewMessage = (socketMessage: SocketMessage): void => {
      console.log("📨 [MESSAGES] Received new message:", socketMessage);
      if (onNewMessage && socketMessage.conversationId === conversationId) {
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
    };

    // Handle online users
    const handleOnlineUsers = (userIds: string[]): void => {
      setOnlineUsers(userIds);
    };

    const handleUserOnline = (data: UserData): void => {
      setOnlineUsers((prev) => [
        ...prev.filter((id) => id !== data.userId),
        data.userId,
      ]);
    };

    const handleUserOffline = (data: UserData): void => {
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    };

    // Handle typing indicators
    const handleTypingStart = (data: TypingData): void => {
      if (data.conversationId === conversationId) {
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
      }
    };

    const handleTypingStop = (data: TypingData): void => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) =>
          prev.filter(
            (user) =>
              !(
                user.userId === data.userId &&
                user.conversationId === data.conversationId
              )
          )
        );
      }
    };

    // Add event listeners
    socket.on("new_message", handleNewMessage);
    socket.on("online_users", handleOnlineUsers);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("user_started_typing", handleTypingStart);
    socket.on("user_stopped_typing", handleTypingStop);

    // Join conversation room
    socket.emit("join_conversation", conversationId);
    console.log("🚪 [MESSAGES] Joined conversation room:", conversationId);

    // Cleanup function
    return () => {
      console.log(
        "🧹 [MESSAGES] Cleaning up message listeners for conversation:",
        conversationId
      );

      // Remove event listeners
      socket.off("new_message", handleNewMessage);
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("user_started_typing", handleTypingStart);
      socket.off("user_stopped_typing", handleTypingStop);

      // Leave conversation room
      socket.emit("leave_conversation", conversationId);

      // Clear active conversation
      setActiveConversation(null);

      // Clear typing indicators
      setTypingUsers([]);
    };
  }, [
    conversationId,
    enabled,
    session?.user,
    onNewMessage,
    setActiveConversation,
    getGlobalSocket,
  ]);

  // Monitor global socket connection status
  useEffect(() => {
    const checkConnection = () => {
      const socket = getGlobalSocket();
      setIsConnected(socket?.connected || false);
    };

    // Check immediately
    checkConnection();

    // Check periodically
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, [getGlobalSocket]);

  // Socket.io functions
  const sendMessage = useCallback(
    (conversationId: string, content: string): string => {
      const socket = getGlobalSocket();
      if (!socket) {
        console.error(
          "❌ [MESSAGES] No global socket available for sending message"
        );
        return "";
      }

      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      socket.emit("send_message", {
        conversationId,
        content,
        tempId,
        senderName: session?.user?.name || "You",
      });

      console.log("📤 [MESSAGES] Sent message via global socket");
      return tempId;
    },
    [session?.user?.name, getGlobalSocket]
  );

  const joinConversation = useCallback(
    (conversationId: string) => {
      const socket = getGlobalSocket();
      if (socket) {
        socket.emit("join_conversation", conversationId);
        console.log(
          "🚪 [MESSAGES] Manually joined conversation:",
          conversationId
        );
      }
    },
    [getGlobalSocket]
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      const socket = getGlobalSocket();
      if (socket) {
        socket.emit("leave_conversation", conversationId);
        console.log(
          "👋 [MESSAGES] Manually left conversation:",
          conversationId
        );
      }
    },
    [getGlobalSocket]
  );

  const startTyping = useCallback(
    (conversationId: string) => {
      const socket = getGlobalSocket();
      if (socket) {
        socket.emit("typing_start", { conversationId });
      }
    },
    [getGlobalSocket]
  );

  const stopTyping = useCallback(
    (conversationId: string) => {
      const socket = getGlobalSocket();
      if (socket) {
        socket.emit("typing_stop", { conversationId });
      }
    },
    [getGlobalSocket]
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
