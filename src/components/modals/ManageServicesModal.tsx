"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface ManageServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentServices: string[];
  onUpdate: (services: string[]) => void;
}

const AVAILABLE_SERVICES = [
  "Plumbing",
  "Electrical",
  "Painting",
  "Carpentry",
  "Appliance Repair",
  "Furniture Assembly",
  "Home Cleaning",
  "Landscaping",
  "Tile Work",
  "Drywall Repair",
  "General Repair",
  "Other",
];

export function ManageServicesModal({
  isOpen,
  onClose,
  currentServices,
  onUpdate,
}: ManageServicesModalProps) {
  const [selectedServices, setSelectedServices] =
    useState<string[]>(currentServices);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedServices(currentServices);
  }, [currentServices]);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleSave = async () => {
    if (selectedServices.length < 2) {
      alert("Please select at least 2 services");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/handyman/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: selectedServices }),
      });

      const data = await response.json();

      if (data.success) {
        onUpdate(selectedServices);
        onClose();
      } else {
        throw new Error(data.error || "Failed to update services");
      }
    } catch (error) {
      console.error("Failed to update services:", error);
      alert("Failed to update services");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Manage Services</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-600">
              Select the services you offer. Choose at least 2.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedServices(AVAILABLE_SERVICES)}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all duration-200"
              >
                ✓ Select All
              </button>
              <button
                onClick={() => setSelectedServices([])}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-all duration-200"
              >
                ✕ Clear All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {AVAILABLE_SERVICES.map((service) => (
              <label
                key={service}
                className="flex items-center p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service)}
                  onChange={() => toggleService(service)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="ml-3 text-slate-700 font-medium">
                  {service}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 Selected: {selectedServices.length} service
              {selectedServices.length !== 1 ? "s" : ""}
            </p>
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
            disabled={loading || selectedServices.length < 2}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? "Saving..." : "Save Services"}
          </Button>
        </div>
      </div>
    </div>
  );
}
