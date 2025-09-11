"use client";

import { useEffect } from "react";

export function NotificationPoller() {
  useEffect(() => {
    const shownNotificationIds = new Set<string>();

    const checkNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?unreadOnly=true");
        const data = await response.json();

        if (data.notifications?.length > 0) {
          data.notifications.forEach(
            (notif: {
              id: string;
              title: string;
              body: string;
              actionUrl?: string;
            }) => {
              if (
                !shownNotificationIds.has(notif.id) &&
                Notification.permission === "granted"
              ) {
                new Notification(notif.title, {
                  body: notif.body,
                  icon: "/favicon.ico",
                });
                shownNotificationIds.add(notif.id);
              }
            }
          );
        }
      } catch (error) {
        console.error("Notification polling error:", error);
      }
    };

    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
