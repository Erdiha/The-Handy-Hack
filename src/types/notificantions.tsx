// types/notifications.ts - CREATE THIS NEW FILE

export interface NotificationData {
  id: string;
  type: "message" | "job_response" | "booking" | "system" | "error" | "success";
  title: string;
  body: string;
  userId: string;
  conversationId?: string;
  jobId?: string;
  actionUrl?: string;
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  browser: boolean;
  sound: boolean;
  email: boolean;
  sms: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
  };
}
// // contexts/NotificationContext.tsx
// ("use client");

// import React, {
//   createContext,
//   useContext,
//   useReducer,
//   useEffect,
//   useCallback,
// } from "react";
// import { useSession } from "next-auth/react";

// interface NotificationState {
//   notifications: NotificationData[];
//   unreadCount: number;
//   preferences: NotificationPreferences;
//   isInitialized: boolean;
//   pushPermission: NotificationPermission | null;
// }

// type NotificationAction =
//   | {
//       type: "INIT";
//       payload: {
//         notifications: NotificationData[];
//         preferences: NotificationPreferences;
//       };
//     }
//   | { type: "ADD_NOTIFICATION"; payload: NotificationData }
//   | { type: "MARK_READ"; payload: string }
//   | { type: "MARK_ALL_READ" }
//   | { type: "REMOVE_NOTIFICATION"; payload: string }
//   | { type: "UPDATE_PREFERENCES"; payload: NotificationPreferences }
//   | { type: "SET_PUSH_PERMISSION"; payload: NotificationPermission };

// const initialState: NotificationState = {
//   notifications: [],
//   unreadCount: 0,
//   preferences: {
//     browser: true,
//     sound: true,
//     email: true,
//     sms: false,
//     quietHours: { enabled: false, start: "22:00", end: "08:00" },
//   },
//   isInitialized: false,
//   pushPermission: null,
// };

// function notificationReducer(
//   state: NotificationState,
//   action: NotificationAction
// ): NotificationState {
//   switch (action.type) {
//     case "INIT":
//       return {
//         ...state,
//         notifications: action.payload.notifications,
//         preferences: action.payload.preferences,
//         unreadCount: action.payload.notifications.filter((n) => !n.readAt)
//           .length,
//         isInitialized: true,
//       };

//     case "ADD_NOTIFICATION":
//       const newNotifications = [action.payload, ...state.notifications];
//       return {
//         ...state,
//         notifications: newNotifications,
//         unreadCount: state.unreadCount + 1,
//       };

//     case "MARK_READ":
//       const updatedNotifications = state.notifications.map((n) =>
//         n.id === action.payload ? { ...n, readAt: new Date() } : n
//       );
//       return {
//         ...state,
//         notifications: updatedNotifications,
//         unreadCount: Math.max(0, state.unreadCount - 1),
//       };

//     case "MARK_ALL_READ":
//       return {
//         ...state,
//         notifications: state.notifications.map((n) => ({
//           ...n,
//           readAt: new Date(),
//         })),
//         unreadCount: 0,
//       };

//     case "REMOVE_NOTIFICATION":
//       const filtered = state.notifications.filter(
//         (n) => n.id !== action.payload
//       );
//       const wasUnread = state.notifications.find(
//         (n) => n.id === action.payload && !n.readAt
//       );
//       return {
//         ...state,
//         notifications: filtered,
//         unreadCount: wasUnread
//           ? Math.max(0, state.unreadCount - 1)
//           : state.unreadCount,
//       };

//     case "UPDATE_PREFERENCES":
//       return {
//         ...state,
//         preferences: action.payload,
//       };

//     case "SET_PUSH_PERMISSION":
//       return {
//         ...state,
//         pushPermission: action.payload,
//       };

//     default:
//       return state;
//   }
// }

// interface NotificationContextType {
//   state: NotificationState;
//   addNotification: (
//     notification: Omit<NotificationData, "id" | "createdAt">
//   ) => void;
//   markAsRead: (id: string) => void;
//   markAllAsRead: () => void;
//   removeNotification: (id: string) => void;
//   updatePreferences: (preferences: NotificationPreferences) => void;
//   requestBrowserPermission: () => Promise<boolean>;
//   showBrowserNotification: (notification: NotificationData) => void;
//   playNotificationSound: () => void;
// }

// const NotificationContext = createContext<NotificationContextType | null>(null);

// export function NotificationProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { data: session } = useSession();
//   const [state, dispatch] = useReducer(notificationReducer, initialState);

//   // Initialize notifications and preferences
//   useEffect(() => {
//     if (session?.user?.id && !state.isInitialized) {
//       initializeNotifications();
//       checkBrowserPermission();
//     }
//   }, [session?.user?.id]);

//   const initializeNotifications = async () => {
//     try {
//       // Load notifications from API
//       const [notificationsRes, preferencesRes] = await Promise.all([
//         fetch("/api/notifications"),
//         fetch("/api/notifications/preferences"),
//       ]);

//       const notifications = notificationsRes.ok
//         ? await notificationsRes.json()
//         : [];
//       const preferences = preferencesRes.ok
//         ? await preferencesRes.json()
//         : initialState.preferences;

//       dispatch({
//         type: "INIT",
//         payload: {
//           notifications: notifications.data || [],
//           preferences: preferences.data || initialState.preferences,
//         },
//       });
//     } catch (error) {
//       console.error("Failed to initialize notifications:", error);
//       dispatch({
//         type: "INIT",
//         payload: { notifications: [], preferences: initialState.preferences },
//       });
//     }
//   };

//   const checkBrowserPermission = () => {
//     if ("Notification" in window) {
//       dispatch({
//         type: "SET_PUSH_PERMISSION",
//         payload: Notification.permission,
//       });
//     }
//   };

//   const addNotification = useCallback(
//     async (notificationData: Omit<NotificationData, "id" | "createdAt">) => {
//       const notification: NotificationData = {
//         ...notificationData,
//         id: Math.random().toString(36).substr(2, 9),
//         createdAt: new Date(),
//       };

//       // Add to state immediately
//       dispatch({ type: "ADD_NOTIFICATION", payload: notification });

//       // Save to database
//       try {
//         await fetch("/api/notifications", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(notification),
//         });
//       } catch (error) {
//         console.error("Failed to save notification:", error);
//       }

//       // Show browser notification if enabled and permission granted
//       if (state.preferences.browser && state.pushPermission === "granted") {
//         showBrowserNotification(notification);
//       }

//       // Play sound if enabled
//       if (state.preferences.sound && !isQuietHours()) {
//         playNotificationSound();
//       }
//     },
//     [state.preferences.browser, state.preferences.sound, state.pushPermission]
//   );

//   const markAsRead = useCallback(async (id: string) => {
//     dispatch({ type: "MARK_READ", payload: id });

//     try {
//       await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
//     } catch (error) {
//       console.error("Failed to mark notification as read:", error);
//     }
//   }, []);

//   const markAllAsRead = useCallback(async () => {
//     dispatch({ type: "MARK_ALL_READ" });

//     try {
//       await fetch("/api/notifications/read-all", { method: "PATCH" });
//     } catch (error) {
//       console.error("Failed to mark all notifications as read:", error);
//     }
//   }, []);

//   const removeNotification = useCallback(async (id: string) => {
//     dispatch({ type: "REMOVE_NOTIFICATION", payload: id });

//     try {
//       await fetch(`/api/notifications/${id}`, { method: "DELETE" });
//     } catch (error) {
//       console.error("Failed to remove notification:", error);
//     }
//   }, []);

//   const updatePreferences = useCallback(
//     async (preferences: NotificationPreferences) => {
//       dispatch({ type: "UPDATE_PREFERENCES", payload: preferences });

//       try {
//         await fetch("/api/notifications/preferences", {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(preferences),
//         });
//       } catch (error) {
//         console.error("Failed to update preferences:", error);
//       }
//     },
//     []
//   );

//   const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
//     if (!("Notification" in window)) {
//       console.warn("Browser does not support notifications");
//       return false;
//     }

//     if (Notification.permission === "granted") {
//       return true;
//     }

//     const permission = await Notification.requestPermission();
//     dispatch({ type: "SET_PUSH_PERMISSION", payload: permission });

//     return permission === "granted";
//   }, []);

//   const showBrowserNotification = useCallback(
//     (notification: NotificationData) => {
//       if (
//         !("Notification" in window) ||
//         Notification.permission !== "granted"
//       ) {
//         return;
//       }

//       if (isQuietHours()) {
//         return;
//       }

//       const browserNotification = new Notification(notification.title, {
//         body: notification.body,
//         icon: "/icon-192.png", // Add your app icon
//         tag: notification.id,
//         requireInteraction: notification.priority === "urgent",
//         badge: "/badge-72.png", // Add your badge icon
//       });

//       browserNotification.onclick = () => {
//         window.focus();
//         if (notification.actionUrl) {
//           window.location.href = notification.actionUrl;
//         }
//         browserNotification.close();
//       };

//       // Auto-close after 5 seconds for non-urgent notifications
//       if (notification.priority !== "urgent") {
//         setTimeout(() => browserNotification.close(), 5000);
//       }
//     },
//     [state.preferences.quietHours]
//   );

//   const playNotificationSound = useCallback(() => {
//     try {
//       const audio = new Audio("/sounds/notification.mp3"); // Add notification sound
//       audio.volume = 0.3;
//       audio.play().catch(console.warn);
//     } catch (error) {
//       console.warn("Could not play notification sound:", error);
//     }
//   }, []);

//   const isQuietHours = useCallback((): boolean => {
//     if (!state.preferences.quietHours.enabled) return false;

//     const now = new Date();
//     const currentTime = now.getHours() * 60 + now.getMinutes();

//     const [startHour, startMin] = state.preferences.quietHours.start
//       .split(":")
//       .map(Number);
//     const [endHour, endMin] = state.preferences.quietHours.end
//       .split(":")
//       .map(Number);

//     const startTime = startHour * 60 + startMin;
//     const endTime = endHour * 60 + endMin;

//     if (startTime <= endTime) {
//       return currentTime >= startTime && currentTime <= endTime;
//     } else {
//       return currentTime >= startTime || currentTime <= endTime;
//     }
//   }, [state.preferences.quietHours]);

//   const contextValue: NotificationContextType = {
//     state,
//     addNotification,
//     markAsRead,
//     markAllAsRead,
//     removeNotification,
//     updatePreferences,
//     requestBrowserPermission,
//     showBrowserNotification,
//     playNotificationSound,
//   };

//   return (
//     <NotificationContext.Provider value={contextValue}>
//       {children}
//     </NotificationContext.Provider>
//   );
// }

// export function useNotifications() {
//   const context = useContext(NotificationContext);
//   if (!context) {
//     throw new Error(
//       "useNotifications must be used within a NotificationProvider"
//     );
//   }
//   return context;
// }

// // components/NotificationBadge.tsx
// ("use client");

// import { useNotifications } from "@/contexts/NotificationContext";

// interface NotificationBadgeProps {
//   className?: string;
//   showZero?: boolean;
// }

// export function NotificationBadge({
//   className = "",
//   showZero = false,
// }: NotificationBadgeProps) {
//   const { state } = useNotifications();

//   if (state.unreadCount === 0 && !showZero) {
//     return null;
//   }

//   return (
//     <span
//       className={`
//       inline-flex items-center justify-center
//       min-w-[20px] h-5 px-1.5 
//       text-xs font-bold text-white 
//       bg-red-500 rounded-full
//       ${className}
//     `}
//     >
//       {state.unreadCount > 99 ? "99+" : state.unreadCount}
//     </span>
//   );
// }

// // components/NotificationButton.tsx
// ("use client");

// import { useState } from "react";
// import { useNotifications } from "@/contexts/NotificationContext";
// import { NotificationBadge } from "./NotificationBadge";

// export function NotificationButton() {
//   const { state, markAsRead, markAllAsRead, removeNotification } =
//     useNotifications();
//   const [isOpen, setIsOpen] = useState(false);

//   const formatTime = (date: Date) => {
//     const now = new Date();
//     const diff = now.getTime() - date.getTime();
//     const minutes = Math.floor(diff / 60000);

//     if (minutes < 1) return "Just now";
//     if (minutes < 60) return `${minutes}m ago`;
//     if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
//     return `${Math.floor(minutes / 1440)}d ago`;
//   };

//   const handleNotificationClick = (notification: NotificationData) => {
//     if (!notification.readAt) {
//       markAsRead(notification.id);
//     }

//     if (notification.actionUrl) {
//       window.location.href = notification.actionUrl;
//     }

//     setIsOpen(false);
//   };

//   return (
//     <div className="relative">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="relative p-2 text-slate-600 hover:text-slate-800 transition-colors"
//         aria-label="Notifications"
//       >
//         <svg
//           className="w-6 h-6"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
//           />
//         </svg>

//         <div className="absolute -top-1 -right-1">
//           <NotificationBadge />
//         </div>
//       </button>

//       {isOpen && (
//         <>
//           <div
//             className="fixed inset-0 z-40"
//             onClick={() => setIsOpen(false)}
//           />

//           <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-hidden">
//             <div className="p-4 border-b border-slate-200">
//               <div className="flex items-center justify-between">
//                 <h3 className="font-semibold text-slate-800">Notifications</h3>
//                 {state.unreadCount > 0 && (
//                   <button
//                     onClick={markAllAsRead}
//                     className="text-sm text-blue-600 hover:text-blue-700"
//                   >
//                     Mark all read
//                   </button>
//                 )}
//               </div>
//             </div>

//             <div className="max-h-64 overflow-y-auto">
//               {state.notifications.length === 0 ? (
//                 <div className="p-8 text-center text-slate-500">
//                   <div className="text-4xl mb-2">🔔</div>
//                   <p>No notifications yet</p>
//                 </div>
//               ) : (
//                 state.notifications.slice(0, 10).map((notification) => (
//                   <div
//                     key={notification.id}
//                     onClick={() => handleNotificationClick(notification)}
//                     className={`
//                       p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors
//                       ${
//                         !notification.readAt
//                           ? "bg-blue-50 border-l-4 border-l-blue-500"
//                           : ""
//                       }
//                     `}
//                   >
//                     <div className="flex items-start justify-between">
//                       <div className="flex-1">
//                         <h4 className="font-medium text-slate-800 text-sm">
//                           {notification.title}
//                         </h4>
//                         <p className="text-slate-600 text-sm mt-1">
//                           {notification.body}
//                         </p>
//                         <p className="text-xs text-slate-500 mt-2">
//                           {formatTime(notification.createdAt)}
//                         </p>
//                       </div>

//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           removeNotification(notification.id);
//                         }}
//                         className="text-slate-400 hover:text-slate-600 p-1"
//                       >
//                         <svg
//                           className="w-4 h-4"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M6 18L18 6M6 6l12 12"
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
