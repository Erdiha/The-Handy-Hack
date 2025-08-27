"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface EmergencyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyAlertModal({
  isOpen,
  onClose,
}: EmergencyAlertModalProps) {
  const [formData, setFormData] = useState({
    problem: "",
    location: "",
    phone: "",
    budget: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch("/api/emergency-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, budget: formData.budget }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          "🚨 Emergency alert sent! Handymen in your area are being notified."
        );
        onClose();
      }
    } catch (error) {
      alert("Failed to send emergency alert");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">🚨 Emergency Help</h2>
                <p className="text-red-100 text-sm">Get immediate assistance</p>
              </div>
              <button
                onClick={onClose}
                className="text-red-200 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What&apos;s the emergency?
              </label>
              <textarea
                value={formData.problem}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, problem: e.target.value }))
                }
                placeholder="e.g., Burst pipe flooding kitchen, electrical sparking, etc."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Your address"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="For immediate contact"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            {/* budget*/}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Emergency rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, budget: e.target.value }))
                  }
                  placeholder="200"
                  min="100"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Minimum $100 for emergency service
              </p>
            </div>

            {/* Emergency Pricing Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-sm">
                <p className="font-semibold text-amber-800 mb-1">
                  Emergency Pricing:
                </p>
                <p className="text-amber-700">
                  • Your rate: ${formData.budget || "100"} minimum •
                  After-hours: +25% additional • Immediate response guaranteed
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
              >
                {sending ? "Alerting..." : "🚨 Send Alert"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
