"use client";

import { motion } from "framer-motion";

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function OnlineStatusIndicator({
  isOnline,
  size = "sm",
  showText = false,
  className = "",
}: OnlineStatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="relative">
        <motion.div
          className={`${sizeClasses[size]} rounded-full ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
          animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
          transition={isOnline ? { duration: 2, repeat: Infinity } : {}}
        />
        {isOnline && (
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-400`}
            animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {showText && (
        <span
          className={`text-xs font-medium ${
            isOnline ? "text-green-600" : "text-gray-500"
          }`}
        >
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
}
