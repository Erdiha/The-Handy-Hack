"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { serviceCategories } from "@/lib/services";

interface ManageServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentServices: string[];
  onUpdate: (services: string[]) => void;
}

// Extract all services from the comprehensive service categories
const ALL_SERVICES = serviceCategories.flatMap((category) =>
  category.services.map((service) => service.name)
);

export function ManageServicesModal({
  isOpen,
  onClose,
  currentServices,
  onUpdate,
}: ManageServicesModalProps) {
  const [selectedServices, setSelectedServices] =
    useState<string[]>(currentServices);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    setSelectedServices(currentServices);
  }, [currentServices]);

  useEffect(() => {
    // Auto-expand categories that have selected services
    const categoriesToExpand = serviceCategories
      .filter((category) =>
        category.services.some((service) =>
          currentServices.includes(service.name)
        )
      )
      .map((category) => category.id);

    setExpandedCategories(categoriesToExpand);
  }, [currentServices]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const selectAllInCategory = (categoryServices: string[]) => {
    const newServices = [
      ...new Set([...selectedServices, ...categoryServices]),
    ];
    setSelectedServices(newServices);
  };

  const clearAllInCategory = (categoryServices: string[]) => {
    setSelectedServices((prev) =>
      prev.filter((service) => !categoryServices.includes(service))
    );
  };

  const handleSave = async () => {
    if (selectedServices.length === 0) {
      alert("Please select at least 1 service");
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Manage Services
            </h2>
            <p className="text-sm text-slate-600">
              Select the services you offer
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Global Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <div
                onClick={() => setSelectedServices(ALL_SERVICES)}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all duration-200 cursor-pointer"
              >
                ✓ Select All
              </div>
              <div
                onClick={() => setSelectedServices([])}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 cursor-pointer"
              >
                ✕ Clear All
              </div>
            </div>

            <div className="text-sm text-slate-600">
              Selected:{" "}
              <span className="font-semibold text-slate-800">
                {selectedServices.length}
              </span>{" "}
              services
            </div>
          </div>

          {/* Service Categories */}
          <div className="space-y-4">
            {serviceCategories.map((category) => {
              const categoryServices = category.services.map((s) => s.name);
              const selectedInCategory = categoryServices.filter((service) =>
                selectedServices.includes(service)
              ).length;
              const isExpanded = expandedCategories.includes(category.id);

              return (
                <div
                  key={category.id}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="bg-slate-50">
                    <div className="flex items-center justify-between p-4">
                      <div
                        onClick={() => toggleCategory(category.id)}
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <span className="text-xl">{category.icon}</span>
                        <div className="text-left">
                          <h3 className="font-semibold text-slate-800">
                            {category.name}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {selectedInCategory}/{categoryServices.length}{" "}
                            selected
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isExpanded && (
                          <div className="flex gap-1">
                            <div
                              onClick={() =>
                                selectAllInCategory(categoryServices)
                              }
                              className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors cursor-pointer"
                            >
                              All
                            </div>
                            <div
                              onClick={() =>
                                clearAllInCategory(categoryServices)
                              }
                              className="px-2 py-1 text-xs text-slate-600 bg-slate-200 rounded hover:bg-slate-300 transition-colors cursor-pointer"
                            >
                              None
                            </div>
                          </div>
                        )}

                        <div
                          onClick={() => toggleCategory(category.id)}
                          className="cursor-pointer p-1"
                        >
                          <svg
                            className={`w-5 h-5 text-slate-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Services */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-white">
                      {category.services.map((service) => (
                        <label
                          key={service.name}
                          className="flex items-start p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.name)}
                            onChange={() => toggleService(service.name)}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mt-1"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-700 group-hover:text-slate-900">
                                {service.name}
                              </span>
                              {/* {service.suggestedRate && (
                                <span className="text-sm text-slate-500 font-medium">
                                  {service.suggestedRate}
                                </span>
                              )} */}
                            </div>

                            {service.description && (
                              <p className="text-sm text-slate-500 mt-1">
                                {service.description}
                              </p>
                            )}

                            {service.requiresVerification && (
                              <div className="flex items-center gap-1 mt-2">
                                <span className="text-xs text-blue-600 font-medium">
                                  🛡️ Background check recommended
                                </span>
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Services Summary */}
          {selectedServices.length > 0 && (
            <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-2">
                Selected Services:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((service) => (
                  <span
                    key={service}
                    className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full border border-orange-200"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            {selectedServices.length === 0 && (
              <span className="text-amber-600">
                Select at least 1 service to continue
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-300 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || selectedServices.length === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : `Save ${selectedServices.length} Service${
                    selectedServices.length !== 1 ? "s" : ""
                  }`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
