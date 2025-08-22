"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/contexts/NotificationContext";
import type { Notification } from "@/contexts/NotificationContext";
import Link from "next/link";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => Promise<void>;
  onClose: () => void;
}

export function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,

    loading,
    markAsRead,
  } = useNotifications();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle hover open/close with delays
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Notification Badge */}
        <AnimatePresence>
          {unreadCount > 0 && !loading && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Content */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute z-50 bg-white rounded-xl shadow-lg border border-slate-200 right-0 mt-2 w-80 max-md:fixed max-md:top-16 max-md:left-4 max-md:right-4 max-md:w-auto max-md:mx-auto max-md:max-w-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded"
                  aria-label="Close notifications"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {notifications.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {/* Show actual notifications */}
                    {notifications.slice(0, 5).map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={markAsRead}
                        onClose={() => setIsOpen(false)}
                      />
                    ))}

                    {notifications.length > 5 && (
                      <div className="text-center text-sm text-slate-500 py-2">
                        +{notifications.length - 5} more notifications
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-3 space-y-2">
                      {unreadCount > 0 && (
                        <Link
                          href="/messages"
                          onClick={() => setIsOpen(false)}
                          className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          View Messages ({unreadCount})
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="text-center py-6 text-slate-500">
                    <div className="text-3xl mb-2">🔔</div>
                    <div className="font-medium text-slate-800 mb-1">
                      All caught up!
                    </div>
                    <div className="text-sm">No new notifications</div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <Link
                    href="/messages"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center text-sm text-slate-500 hover:text-slate-700 py-2"
                  >
                    View All Messages
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({
  notification,
  onRead,
  onClose,
}: NotificationItemProps) {
  const handleClick = async () => {
    if (!notification.isRead) {
      await onRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    onClose();
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "message":
        return "💬";
      case "job_response":
        return "💼";
      case "booking":
        return "📅";
      case "system":
        return "🔔";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (
    priority: Notification["priority"],
    isRead: boolean
  ) => {
    if (isRead) {
      return "bg-slate-50 border-slate-200";
    }

    switch (priority) {
      case "urgent":
        return "bg-red-50 border-red-200";
      case "high":
        return "bg-orange-50 border-orange-200";
      case "normal":
      case "low":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${getNotificationColor(
        notification.priority,
        notification.isRead
      )} ${notification.isRead ? "hover:bg-slate-100" : "hover:bg-opacity-80"}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-lg flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`font-medium text-sm mb-1 ${
              notification.isRead ? "text-slate-700" : "text-slate-900"
            }`}
          >
            {notification.title}
          </div>
          <div
            className={`text-xs ${
              notification.isRead ? "text-slate-500" : "text-slate-600"
            }`}
          >
            {notification.body}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {notification.timeAgo}
          </div>
        </div>

        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
        )}
      </div>
    </div>
  );
}
