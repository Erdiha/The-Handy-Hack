// contexts/NotificationContext.tsx - CREATE THIS NEW FILE

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import {
  NotificationData,
  NotificationPreferences,
} from "@/types/notificantions";

interface NotificationState {
  notifications: NotificationData[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isInitialized: boolean;
  pushPermission: NotificationPermission | null;
}

type NotificationAction =
  | {
      type: "INIT";
      payload: {
        notifications: NotificationData[];
        preferences: NotificationPreferences;
      };
    }
  | { type: "ADD_NOTIFICATION"; payload: NotificationData }
  | { type: "MARK_READ"; payload: string }
  | { type: "MARK_ALL_READ" }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "UPDATE_PREFERENCES"; payload: NotificationPreferences }
  | { type: "SET_PUSH_PERMISSION"; payload: NotificationPermission };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  preferences: {
    browser: true,
    sound: true,
    email: true,
    sms: false,
    quietHours: { enabled: false, start: "22:00", end: "08:00" },
  },
  isInitialized: false,
  pushPermission: null,
};

function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        notifications: action.payload.notifications,
        preferences: action.payload.preferences,
        unreadCount: action.payload.notifications.filter((n) => !n.readAt)
          .length,
        isInitialized: true,
      };

    case "ADD_NOTIFICATION":
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: state.unreadCount + 1,
      };

    case "MARK_READ":
      const updatedNotifications = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, readAt: new Date() } : n
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    case "MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({
          ...n,
          readAt: new Date(),
        })),
        unreadCount: 0,
      };

    case "REMOVE_NOTIFICATION":
      const filtered = state.notifications.filter(
        (n) => n.id !== action.payload
      );
      const wasUnread = state.notifications.find(
        (n) => n.id === action.payload && !n.readAt
      );
      return {
        ...state,
        notifications: filtered,
        unreadCount: wasUnread
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };

    case "UPDATE_PREFERENCES":
      return {
        ...state,
        preferences: action.payload,
      };

    case "SET_PUSH_PERMISSION":
      return {
        ...state,
        pushPermission: action.payload,
      };

    default:
      return state;
  }
}

interface NotificationContextType {
  state: NotificationState;
  addNotification: (
    notification: Omit<NotificationData, "id" | "createdAt">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  updatePreferences: (preferences: NotificationPreferences) => void;
  requestBrowserPermission: () => Promise<boolean>;
  showBrowserNotification: (notification: NotificationData) => void;
  playNotificationSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Initialize notifications and preferences
  useEffect(() => {
    if (session?.user?.id && !state.isInitialized) {
      initializeNotifications();
      checkBrowserPermission();
    }
  }, [session?.user?.id]);

  const initializeNotifications = async () => {
    try {
      // For now, initialize with empty data - we'll add API calls later
      console.log("Initializing notifications for user:", session?.user?.id);

      dispatch({
        type: "INIT",
        payload: {
          notifications: [],
          preferences: initialState.preferences,
        },
      });
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
      dispatch({
        type: "INIT",
        payload: { notifications: [], preferences: initialState.preferences },
      });
    }
  };

  const checkBrowserPermission = () => {
    if ("Notification" in window) {
      dispatch({
        type: "SET_PUSH_PERMISSION",
        payload: Notification.permission,
      });
    }
  };

  const addNotification = useCallback(
    async (notificationData: Omit<NotificationData, "id" | "createdAt">) => {
      const notification: NotificationData = {
        ...notificationData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      };

      console.log("Adding notification:", notification);

      // Add to state immediately
      dispatch({ type: "ADD_NOTIFICATION", payload: notification });

      // Show browser notification if enabled and permission granted
      if (state.preferences.browser && state.pushPermission === "granted") {
        showBrowserNotification(notification);
      }

      // Play sound if enabled
      if (state.preferences.sound && !isQuietHours()) {
        playNotificationSound();
      }
    },
    [state.preferences.browser, state.preferences.sound, state.pushPermission]
  );

  const markAsRead = useCallback(async (id: string) => {
    console.log("Marking notification as read:", id);
    dispatch({ type: "MARK_READ", payload: id });
  }, []);

  const markAllAsRead = useCallback(async () => {
    console.log("Marking all notifications as read");
    dispatch({ type: "MARK_ALL_READ" });
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    console.log("Removing notification:", id);
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  }, []);

  const updatePreferences = useCallback(
    async (preferences: NotificationPreferences) => {
      console.log("Updating notification preferences:", preferences);
      dispatch({ type: "UPDATE_PREFERENCES", payload: preferences });
    },
    []
  );

  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    dispatch({ type: "SET_PUSH_PERMISSION", payload: permission });

    return permission === "granted";
  }, []);

  const showBrowserNotification = useCallback(
    (notification: NotificationData) => {
      if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      if (isQuietHours()) {
        return;
      }

      console.log("Showing browser notification:", notification.title);

      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: "/favicon.ico", // Use your app icon
        tag: notification.id,
        requireInteraction: notification.priority === "urgent",
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== "urgent") {
        setTimeout(() => browserNotification.close(), 5000);
      }
    },
    [state.preferences.quietHours]
  );

  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn("Could not play notification sound:", error);
    }
  }, []);

  const isQuietHours = useCallback((): boolean => {
    if (!state.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = state.preferences.quietHours.start
      .split(":")
      .map(Number);
    const [endHour, endMin] = state.preferences.quietHours.end
      .split(":")
      .map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [state.preferences.quietHours]);

  const contextValue: NotificationContextType = {
    state,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    updatePreferences,
    requestBrowserPermission,
    showBrowserNotification,
    playNotificationSound,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
