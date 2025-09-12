"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { ResponsiveSelect } from "@/components/ui/ResponsiveSelect";
import { serviceCategories } from "@/lib/services";
import { AddressAutocomplete } from "@/components/ui/AddressInput";

export default function PostJobPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    urgency: "flexible",
    budget: "hour",
    budgetAmount: "",
    location: "", // This will be synced with address autocomplete
  });

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin?redirect=/post-job");
    }
  }, [session, router]);

  if (!session) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Enhanced validation functions
  const validateTitle = (title: string): string => {
    if (!title.trim()) return "Job title is required";
    if (title.trim().length < 5)
      return "Job title must be at least 5 characters";
    if (title.trim().length > 100)
      return "Job title must be less than 100 characters";

    // Check for spam patterns
    if (/(.)\1{4,}/.test(title)) return "Please use a proper job title";

    return "";
  };

  const validateDescription = (description: string): string => {
    if (!description.trim()) return "Job description is required";
    if (description.trim().length < 20)
      return "Description must be at least 20 characters";
    if (description.trim().length > 1000)
      return "Description must be less than 1000 characters";

    // Encourage details
    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount < 10)
      return "Please provide more details (at least 10 words)";

    return "";
  };

  const validateBudget = (budget: string, budgetAmount: string): string => {
    if (budget !== "quote" && !budgetAmount.trim()) {
      return "Budget amount is required";
    }

    if (budgetAmount) {
      const amount = parseFloat(budgetAmount);
      if (isNaN(amount) || amount <= 0) {
        return "Please enter a valid amount";
      }
      if (amount > 10000) {
        return "Maximum budget is $10,000";
      }
    }

    return "";
  };

  const validateCategory = (category: string): string => {
    if (!category) return "Please select a category";
    return "";
  };

  const validateLocation = (location: string): string => {
    if (!location.trim()) return "Job location is required";
    return "";
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle address change and sync with form data
  const handleAddressChange = (address: string) => {
    setFormData((prev) => ({ ...prev, location: address }));
    // Clear location error when address is updated
    if (errors.location) {
      setErrors((prev) => ({ ...prev, location: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const titleError = validateTitle(formData.title);
    const descError = validateDescription(formData.description);
    const budgetError = validateBudget(formData.budget, formData.budgetAmount);
    const categoryError = validateCategory(formData.category);
    const locationError = validateLocation(formData.location);

    const newErrors = {
      title: titleError,
      description: descError,
      budget: budgetError,
      category: categoryError,
      location: locationError,
    };

    setErrors(newErrors);

    // Stop if there are errors
    if (
      titleError ||
      descError ||
      budgetError ||
      categoryError ||
      locationError
    ) {
      console.log("❌ Form validation failed");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Success! Redirect to jobs page to see the posted job
        router.push("/jobs?posted=true");
      } else {
        console.error("Failed to post job:", data.error);
        alert("Failed to post job: " + data.error);
      }
    } catch (error) {
      console.error("Failed to post job:", error);
      alert("Failed to post job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-orange-50">
      {/* Header */}
      <div className="bg-orange-50 border-b border-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">
                Post Your Job
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Tell us what you need done and get quotes from trusted local
                handymen
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-orange-50 rounded-3xl shadow-xl border border-orange-100 overflow-hidden"
          >
            <div className="p-8 space-y-8">
              {/* Job Title */}
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  What do you need done?
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Fix leaky kitchen faucet, Install ceiling fan, Paint living room"
                  className={`w-full px-4 py-4 text-lg border bg-white rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all duration-200 ${
                    errors.title
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-200 focus:border-orange-500"
                  }`}
                  required
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.title}</p>
                )}
              </div>

              {/* Category Selection */}
              <ResponsiveSelect
                label="What type of work is this?"
                value={formData.category}
                onChange={(value) => handleInputChange("category", value)}
                options={[
                  { value: "", label: "Select a service type..." },
                  ...serviceCategories.flatMap((category) =>
                    category.services.map((service) => ({
                      value: service.name,
                      label: `${category.icon} ${service.name}`,
                    }))
                  ),
                ]}
                placeholder="Choose your service type..."
                error={errors.category}
                searchable={true}
              />

              {/* Show selected service description */}
              {formData.category && formData.category !== "Other" && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  {(() => {
                    const selectedService = serviceCategories
                      .flatMap((cat) => cat.services)
                      .find((service) => service.name === formData.category);

                    return selectedService ? (
                      <div className="flex items-start space-x-3">
                        <div className="text-orange-600">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-slate-700 mb-1">
                            <span className="font-medium">
                              {selectedService.name}:
                            </span>{" "}
                            {selectedService.description}
                          </p>
                          {selectedService.suggestedRate && (
                            <p className="text-xs text-slate-500">
                              💡 Typical rate: {selectedService.suggestedRate}
                            </p>
                          )}
                          {selectedService.requiresVerification && (
                            <p className="text-xs text-blue-600 font-medium">
                              🛡️ Background check recommended for this service
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Urgency */}
              <ResponsiveSelect
                label="When do you need this done?"
                value={formData.urgency}
                onChange={(value) => handleInputChange("urgency", value)}
                options={[
                  { value: "asap", label: "ASAP (Today/Tomorrow)" },
                  { value: "week", label: "This week" },
                  { value: "flexible", label: "I'm flexible" },
                  { value: "emergency", label: "Emergency (Now!)" },
                ]}
                placeholder="Select timing..."
              />

              {/* Description */}
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  Describe the job in detail
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={5}
                  placeholder="Be specific about what needs to be done, any materials required, access to the area, etc. The more details you provide, the better quotes you'll receive."
                  className={`w-full px-4 py-4 text-lg border bg-white rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all duration-200 resize-none ${
                    errors.description
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-200 focus:border-orange-500"
                  }`}
                  required
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">
                    ⚠️ {errors.description}
                  </p>
                )}
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-slate-500">
                    Include materials, access details, specific requirements
                  </p>
                  <p
                    className={`text-xs ${
                      formData.description.length > 900
                        ? "text-red-500"
                        : "text-slate-500"
                    }`}
                  >
                    {formData.description.length}/1000 characters
                  </p>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  Budget
                </label>
                <div className="grid sm:grid-cols-2 gap-4 items-end">
                  <ResponsiveSelect
                    label=""
                    value={formData.budget}
                    onChange={(value) => handleInputChange("budget", value)}
                    options={[
                      { value: "hour", label: "Hourly rate" },
                      { value: "fixed", label: "Fixed price" },
                      { value: "quote", label: "Get quotes" },
                    ]}
                    placeholder="Select budget type..."
                  />

                  {formData.budget !== "quote" && (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg z-10">
                        $
                      </span>
                      <input
                        type="number"
                        value={formData.budgetAmount}
                        onChange={(e) =>
                          handleInputChange("budgetAmount", e.target.value)
                        }
                        placeholder={formData.budget === "hour" ? "75" : "200"}
                        className="w-full pl-8 pr-4 py-4 text-lg border bg-white border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
                      />
                    </div>
                  )}
                </div>
                {errors.budget && (
                  <p className="mt-2 text-sm text-red-600">
                    ⚠️ {errors.budget}
                  </p>
                )}
              </div>

              {/* Location - FIXED: Now properly synced */}
              <div>
                <AddressAutocomplete
                  label="Job Location"
                  value={formData.location}
                  onChange={handleAddressChange}
                  onAddressSelected={(addressData) => {
                    // Use the standardized formatted address
                    handleAddressChange(addressData.standardized);
                  }}
                  required
                  placeholder="Where do you need help?"
                  error={errors.location}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-8 py-6 border-t border-orange-200">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="text-center sm:text-left">
                  <p className="text-slate-600 text-sm">
                    By posting, you agree to our terms and conditions
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    💡 Free to post • Only pay when you hire
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? "Posting..." : "Post Job & Get Quotes"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
