"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, type, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }} // Reduced movement
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }} // Subtle exit
          transition={{ duration: 0.2, ease: "easeOut" }} // Faster, smoother
          className="fixed top-20 right-4 z-50"
        >
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border ${
              // Smaller padding
              type === "success"
                ? "bg-white border-green-300 text-green-700"
                : "bg-white border-red-300 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  // Simple dot instead of emoji
                  type === "success" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium">{message}</span>{" "}
              {/* Smaller text */}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
