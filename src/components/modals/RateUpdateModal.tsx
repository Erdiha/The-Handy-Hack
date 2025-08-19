"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface RateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRate: string;
  onUpdate: (newRate: string) => void;
}

export function RateUpdateModal({
  isOpen,
  onClose,
  currentRate,
  onUpdate,
}: RateUpdateModalProps) {
  const [newRate, setNewRate] = useState(currentRate);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      setError("Please enter a valid hourly rate");
      return;
    }

    if (rate > 500) {
      setError("Rate seems too high. Please enter a reasonable amount");
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch("/api/handyman/update-rate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate: newRate }),
      });

      const data = await response.json();

      if (data.success) {
        onUpdate(newRate);
        onClose();
      } else {
        setError(data.error || "Failed to update rate");
      }
    } catch (error) {
      setError("Failed to update rate");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Hourly Rate"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            New Hourly Rate
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-lg">
              $
            </span>
            <input
              type="number"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="w-full pl-10 pr-16 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="50"
              min="1"
              step="1"
              required
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
              /hour
            </span>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="bg-orange-50 p-4 rounded-xl">
          <h4 className="font-medium text-slate-800 mb-2">Rate Guidelines</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Average in your area: $45-75/hour</li>
            <li>• Consider your experience level</li>
            <li>• You can always adjust later</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updating}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {updating ? "Updating..." : "Update Rate"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
