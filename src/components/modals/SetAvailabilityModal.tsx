"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

type WeeklySchedule = {
  [key: string]: { start: string; end: string; enabled: boolean };
};

interface AvailabilityData {
  weeklySchedule: WeeklySchedule;
  responseTime: string;
  vacationMode: boolean;
  vacationUntil: string;
  instantBooking: boolean;
  emergencyAvailable: boolean;
  bufferTime: number;
}

interface SetAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvailability: AvailabilityData;
  onUpdate: (availability: AvailabilityData) => void;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const QUICK_PRESETS = [
  {
    name: "9-5 Weekdays",
    schedule: {
      Monday: "09:00-17:00",
      Tuesday: "09:00-17:00",
      Wednesday: "09:00-17:00",
      Thursday: "09:00-17:00",
      Friday: "09:00-17:00",
    },
  },
  {
    name: "Weekends Only",
    schedule: { Saturday: "10:00-16:00", Sunday: "10:00-16:00" },
  },
  {
    name: "Evenings",
    schedule: {
      Monday: "18:00-21:00",
      Tuesday: "18:00-21:00",
      Wednesday: "18:00-21:00",
      Thursday: "18:00-21:00",
      Friday: "18:00-21:00",
    },
  },
  {
    name: "24/7",
    schedule: {
      Monday: "00:00-23:59",
      Tuesday: "00:00-23:59",
      Wednesday: "00:00-23:59",
      Thursday: "00:00-23:59",
      Friday: "00:00-23:59",
      Saturday: "00:00-23:59",
      Sunday: "00:00-23:59",
    },
  },
];

export function SetAvailabilityModal({
  isOpen,
  onClose,
  currentAvailability,
  onUpdate,
}: SetAvailabilityModalProps) {
  const [availability, setAvailability] =
    useState<AvailabilityData>(currentAvailability);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAvailability(currentAvailability);
  }, [currentAvailability]);

  const toggleDay = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          enabled: !prev.weeklySchedule[day]?.enabled,
        },
      },
    }));
  };

  const updateDayTime = (
    day: string,
    field: "start" | "end",
    value: string
  ) => {
    setAvailability((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          [field]: value,
          enabled: true,
        },
      },
    }));
  };

  const applyPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    const newSchedule: {
      [key: string]: { start: string; end: string; enabled: boolean };
    } = {};

    // Reset all days
    DAYS.forEach((day) => {
      newSchedule[day] = { start: "09:00", end: "17:00", enabled: false };
    });

    // Apply preset
    Object.entries(preset.schedule).forEach(([day, timeRange]) => {
      const [start, end] = timeRange.split("-");
      newSchedule[day] = { start, end, enabled: true };
    });

    setAvailability((prev) => ({
      ...prev,
      weeklySchedule: newSchedule,
    }));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/handyman/availability-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(availability),
      });

      const data = await response.json();

      if (data.success) {
        onUpdate(availability);
        onClose();
      } else {
        throw new Error(data.error || "Failed to update availability");
      }
    } catch (error) {
      console.error("Failed to update availability:", error);
      alert("Failed to update availability");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Set Availability</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Quick Presets */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Quick Presets
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="p-3 text-sm text-center border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Schedule */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Weekly Schedule
            </h3>
            <div className="space-y-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg"
                >
                  <label className="flex items-center min-w-[100px]">
                    <input
                      type="checkbox"
                      checked={
                        availability.weeklySchedule[day]?.enabled || false
                      }
                      onChange={() => toggleDay(day)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm font-medium">{day}</span>
                  </label>

                  {availability.weeklySchedule[day]?.enabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={
                          availability.weeklySchedule[day]?.start || "09:00"
                        }
                        onChange={(e) =>
                          updateDayTime(day, "start", e.target.value)
                        }
                        className="px-2 py-1 text-sm border border-slate-300 rounded"
                      />
                      <span className="text-slate-500">to</span>
                      <input
                        type="time"
                        value={availability.weeklySchedule[day]?.end || "17:00"}
                        onChange={(e) =>
                          updateDayTime(day, "end", e.target.value)
                        }
                        className="px-2 py-1 text-sm border border-slate-300 rounded"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Response Time */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Response Time
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {["15 minutes", "1 hour", "4 hours", "24 hours"].map((time) => (
                <button
                  key={time}
                  onClick={() =>
                    setAvailability((prev) => ({ ...prev, responseTime: time }))
                  }
                  className={`p-2 text-sm rounded-lg border transition-all duration-200 ${
                    availability.responseTime === time
                      ? "bg-blue-500 text-white border-blue-500"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Additional Settings
            </h3>

            {/* Vacation Mode */}
            <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div>
                <span className="font-medium text-slate-700">
                  Vacation Mode
                </span>
                <p className="text-sm text-slate-500">
                  Temporarily hide from search results
                </p>
              </div>
              <input
                type="checkbox"
                checked={availability.vacationMode}
                onChange={(e) =>
                  setAvailability((prev) => ({
                    ...prev,
                    vacationMode: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
            </label>

            {availability.vacationMode && (
              <div className="ml-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Available again on:
                </label>
                <input
                  type="date"
                  value={availability.vacationUntil}
                  onChange={(e) =>
                    setAvailability((prev) => ({
                      ...prev,
                      vacationUntil: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            )}

            {/* Instant Booking */}
            <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div>
                <span className="font-medium text-slate-700">
                  Instant Booking
                </span>
                <p className="text-sm text-slate-500">
                  Customers can book immediately without approval
                </p>
              </div>
              <input
                type="checkbox"
                checked={availability.instantBooking}
                onChange={(e) =>
                  setAvailability((prev) => ({
                    ...prev,
                    instantBooking: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
            </label>

            {/* Emergency Availability */}
            <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div>
                <span className="font-medium text-slate-700">
                  Emergency Availability
                </span>
                <p className="text-sm text-slate-500">
                  Available for urgent jobs even when offline
                </p>
              </div>
              <input
                type="checkbox"
                checked={availability.emergencyAvailable}
                onChange={(e) =>
                  setAvailability((prev) => ({
                    ...prev,
                    emergencyAvailable: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
            </label>

            {/* Buffer Time */}
            <div className="p-3 border border-slate-200 rounded-lg">
              <label className="block font-medium text-slate-700 mb-2">
                Buffer Time Between Jobs
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="15"
                  value={availability.bufferTime}
                  onChange={(e) =>
                    setAvailability((prev) => ({
                      ...prev,
                      bufferTime: parseInt(e.target.value),
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-sm font-medium min-w-[80px]">
                  {availability.bufferTime} minutes
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Travel time and prep between jobs
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-300 text-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? "Saving..." : "Save Availability"}
          </Button>
        </div>
      </div>
    </div>
  );
}
