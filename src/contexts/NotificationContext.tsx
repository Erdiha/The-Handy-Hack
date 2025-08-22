"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

declare global {
  interface Window {
    globalSocket?: Socket;
  }
}
// Notification object interface
export interface Notification {
  id: string;
  type: "message" | "job_response" | "booking" | "system";
  title: string;
  body: string;
  actionUrl?: string;
  conversationId?: string;
  jobId?: string;
  priority: "low" | "normal" | "high" | "urgent";
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
}

interface NotificationContextType {
  // Notification objects and counts
  notifications: Notification[];
  unreadCount: number;
  unreadMessageCount: number;

  // Actions
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;

  // Loading state
  loading: boolean;

  // Socket state
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Track active conversation to suppress notifications
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  // Load notifications function
  const loadNotifications = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      console.log(
        "🔔 [GLOBAL] Fetching notifications for user:",
        session.user.id
      );
      const response = await fetch("/api/notifications?limit=20");
      const data = await response.json();

      console.log("🔔 [GLOBAL] Notification API response:", data);

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setUnreadMessageCount(data.unreadMessageCount || 0);

        console.log(
          "🔔 [GLOBAL] Updated counts - unread:",
          data.unreadCount,
          "messages:",
          data.unreadMessageCount
        );
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh notifications function
  const refreshNotifications = async () => {
    if (!session?.user?.id) return;

    try {
      console.log("🔔 [GLOBAL] Refreshing notifications...");
      const response = await fetch("/api/notifications?limit=20");
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setUnreadMessageCount(data.unreadMessageCount || 0);

        console.log("🔔 [GLOBAL] Refreshed counts - unread:", data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    }
  };

  // Mark individual notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
        console.log("🔔 [GLOBAL] Marked notification as read:", notificationId);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Set active conversation (to suppress notifications)
  const setActiveConversation = (conversationId: string | null) => {
    console.log("🔔 [GLOBAL] Active conversation changed:", conversationId);
    setActiveConversationId(conversationId);
  };

  // Global Socket.io connection for notifications
  useEffect(() => {
    if (!session?.user?.id) return;

    console.log(
      "🔔 [GLOBAL] Initializing global notification socket for user:",
      session.user.id
    );

    const socket = io({
      path: "/socket.io",
    });
    socket.on("connect", () => {
      console.log(
        "🔔 [GLOBAL] Connected to Socket.io server for notifications"
      );
      setIsConnected(true);

      // Authenticate user for notifications
      socket.emit("authenticate", {
        userId: session.user.id,
        userName: session.user.name,
      });

      // Expose socket globally for useRealTimeMessages hook
      window.globalSocket = socket;

      console.log("🔔 [GLOBAL] Sent authentication for notifications");
    });
    socket.on("disconnect", () => {
      console.log("🔔 [GLOBAL] Disconnected from Socket.io server");
      setIsConnected(false);
    });

    // Listen for notification updates globally
    socket.on("notification_update", (data) => {
      console.log("🔔 [GLOBAL] Received notification update:", data);

      // Smart suppression: don't refresh if user is actively viewing this conversation
      if (data.conversationId && data.conversationId === activeConversationId) {
        console.log(
          "🔔 [GLOBAL] Suppressing notification - user is actively viewing conversation:",
          data.conversationId
        );
        return;
      }

      // If user is not viewing this conversation, refresh notifications
      console.log(
        "🔔 [GLOBAL] Processing notification update - refreshing counts"
      );
      refreshNotifications();
    });

    socketRef.current = socket;

    return () => {
      console.log("🔔 [GLOBAL] Cleaning up notification socket");
      window.globalSocket = undefined; // Clean up global reference
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.user?.id, activeConversationId]);

  // Load initial notifications when user logs in
  useEffect(() => {
    loadNotifications();
  }, [session?.user?.id]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    unreadMessageCount,
    refreshNotifications,
    markAsRead,
    setActiveConversation,
    loading,
    isConnected,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
