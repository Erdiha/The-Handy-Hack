// components/NotificationButton.tsx - Modal Version

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { NotificationBadge } from "./NotificationBadge";
import { NotificationData } from "@/types/notificantions";

export function NotificationButton() {
  const { state, markAsRead, markAllAsRead, removeNotification } =
    useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile vs desktop
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.readAt) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    // Close modal/dropdown
    setIsModalOpen(false);
    setIsDropdownOpen(false);
  };

  // Clear timeout
  const clearCloseTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Set timeout to close dropdown
  const startCloseTimeout = useCallback(() => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 1200);
  }, [clearCloseTimeout]);

  // Handle button click
  const handleButtonClick = () => {
    if (isMobile) {
      setIsModalOpen(true);
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Desktop hover handlers
  const handleMouseEnter = useCallback(() => {
    if (!isMobile) {
      clearCloseTimeout();
      setIsDropdownOpen(true);
    }
  }, [isMobile, clearCloseTimeout]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      startCloseTimeout();
    }
  }, [isMobile, startCloseTimeout]);

  // Notification list component (reused in dropdown and modal)
  const NotificationList = ({ onClose }: { onClose: () => void }) => (
    <div className="max-h-96 overflow-y-auto">
      {state.notifications.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          <div className="text-4xl mb-2">🔔</div>
          <p>No notifications yet</p>
        </div>
      ) : (
        state.notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors duration-200 ${
              !notification.readAt
                ? "bg-blue-50 border-l-4 border-l-blue-500"
                : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-slate-800 text-sm">
                  {notification.title}
                </h4>
                <p className="text-slate-600 text-sm mt-1">
                  {notification.body}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {formatTime(notification.createdAt)}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4"
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
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <div
        className="relative cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={handleButtonClick}
          className="relative p-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
          aria-label="Notifications"
        >
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

          <div className="absolute -top-1 -right-1">
            <NotificationBadge />
          </div>
        </button>

        {/* Desktop Dropdown */}
        {!isMobile && (
          <div
            className={`absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden transition-all duration-200 transform origin-top-right ${
              isDropdownOpen
                ? "opacity-100 scale-100 visible"
                : "opacity-0 scale-95 invisible"
            }`}
            style={{ zIndex: 50 }}
          >
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {state.unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    onMouseEnter={clearCloseTimeout}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <NotificationList onClose={() => setIsDropdownOpen(false)} />
          </div>
        )}
      </div>

      {/* Mobile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                Notifications
              </h2>
              <div className="flex items-center space-x-3">
                {state.unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors duration-200"
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
            </div>

            {/* Modal Content */}
            <NotificationList onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
