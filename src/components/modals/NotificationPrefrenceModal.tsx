"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPreferencesModal({
  isOpen,
  onClose,
}: NotificationPreferencesModalProps) {
  const [preferences, setPreferences] = useState({
    browser: true,
    sound: true,
    email: false,
    sms: false,
  });

  const [saving, setSaving] = useState(false);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // We'll add API call here later
      console.log("Saving preferences:", preferences);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Fake delay
      onClose();
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-xl max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              Notification Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
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
          <div className="p-6 space-y-4">
            {/* Browser Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🌐</span>
                </div>
                <div>
                  <div className="font-medium text-slate-900">
                    Browser Notifications
                  </div>
                  <div className="text-sm text-slate-600">
                    Show notifications in your browser
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle("browser")}
                className={`w-11 h-6 rounded-full transition-colors ${
                  preferences.browser ? "bg-orange-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.browser ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Sound Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔊</span>
                </div>
                <div>
                  <div className="font-medium text-slate-900">Sound Alerts</div>
                  <div className="text-sm text-slate-600">
                    Play sound for new notifications
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle("sound")}
                className={`w-11 h-6 rounded-full transition-colors ${
                  preferences.sound ? "bg-orange-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.sound ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📧</span>
                </div>
                <div>
                  <div className="font-medium text-slate-900">
                    Email Notifications
                  </div>
                  <div className="text-sm text-slate-600">
                    Receive notifications via email
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle("email")}
                className={`w-11 h-6 rounded-full transition-colors ${
                  preferences.email ? "bg-orange-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.email ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📱</span>
                </div>
                <div>
                  <div className="font-medium text-slate-900">
                    SMS Notifications
                  </div>
                  <div className="text-sm text-slate-600">
                    Receive notifications via text
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle("sms")}
                className={`w-11 h-6 rounded-full transition-colors ${
                  preferences.sms ? "bg-orange-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.sms ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium rounded-lg"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
