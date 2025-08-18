// components/NotificationBadge.tsx - CREATE THIS NEW FILE

"use client";

import { useNotifications } from "@/contexts/NotificationContext";

interface NotificationBadgeProps {
  className?: string;
  showZero?: boolean;
}

export function NotificationBadge({
  className = "",
  showZero = false,
}: NotificationBadgeProps) {
  const { state } = useNotifications();

  if (state.unreadCount === 0 && !showZero) {
    return null;
  }

  return (
    <span
      className={`
      inline-flex items-center justify-center
      min-w-[20px] h-5 px-1.5 
      text-xs font-bold text-white 
      bg-red-500 rounded-full
      ${className}
    `}
    >
      {state.unreadCount > 99 ? "99+" : state.unreadCount}
    </span>
  );
}
