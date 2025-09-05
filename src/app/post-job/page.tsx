"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PostJobPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    urgency: "flexible",
    budget: "hour",
    budgetAmount: "",
    location: "",
    // photos: [] as string[],
  });

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Enhanced photo upload
  // const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = Array.from(e.target.files || []);
  //   if (files.length === 0) return;

  //   // Validate files
  //   const maxSize = 5 * 1024 * 1024; // 5MB
  //   const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  //   const validFiles = files.filter((file) => {
  //     if (file.size > maxSize) {
  //       alert(`${file.name} is too large. Max size is 5MB.`);
  //       return false;
  //     }
  //     if (!allowedTypes.includes(file.type)) {
  //       alert(`${file.name} is not a supported image format.`);
  //       return false;
  //     }
  //     return true;
  //   });

  //   if (validFiles.length === 0) return;

  //   setUploading(true);

  //   try {
  //     console.log("📸 Starting upload of", validFiles.length, "files");

  //     const uploadedUrls: string[] = [];

  //     for (const file of validFiles) {
  //       const timestamp = Date.now();
  //       const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  //       const filename = `job-photos/${timestamp}-${cleanName}`;

  //       console.log("📤 Uploading:", filename);

  //       const response = await fetch(
  //         `/api/upload?filename=${encodeURIComponent(filename)}`,
  //         {
  //           method: "POST",
  //           body: file,
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error(`Upload failed: ${response.statusText}`);
  //       }

  //       const result = await response.json();

  //       if (!result.success) {
  //         throw new Error(result.error || "Upload failed");
  //       }

  //       uploadedUrls.push(result.url);
  //       console.log("✅ Uploaded:", result.url);
  //     }

  //     // Update formData with new photo URLs
  //     setFormData((prev) => ({
  //       ...prev,
  //       photos: [...prev.photos, ...uploadedUrls],
  //     }));

  //     console.log("🎉 All uploads complete");
  //   } catch (error) {
  //     console.error("❌ Upload failed:", error);
  //     alert(
  //       `Failed to upload photos: ${
  //         error instanceof Error ? error.message : "Unknown error"
  //       }`
  //     );
  //   } finally {
  //     setUploading(false);
  //     // Clear the input
  //     e.target.value = "";
  //   }
  // };

  // const removePhoto = (index: number) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     photos: prev.photos.filter((_, i) => i !== index),
  //   }));
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const titleError = validateTitle(formData.title);
    const descError = validateDescription(formData.description);
    const budgetError = validateBudget(formData.budget, formData.budgetAmount);
    const categoryError = validateCategory(formData.category);

    const newErrors = {
      title: titleError,
      description: descError,
      budget: budgetError,
      category: categoryError,
    };

    setErrors(newErrors);

    // Stop if there are errors
    if (titleError || descError || budgetError || categoryError) {
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

              {/* Enhanced Category Selection */}
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  What type of work is this?
                </label>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { name: "Plumbing", icon: "🔧", color: "blue" },
                    { name: "Electrical", icon: "⚡", color: "yellow" },
                    { name: "Painting", icon: "🎨", color: "purple" },
                    { name: "Carpentry", icon: "🔨", color: "orange" },
                    { name: "Appliance Repair", icon: "🔌", color: "green" },
                    { name: "Furniture Assembly", icon: "🪑", color: "brown" },
                    { name: "Home Cleaning", icon: "🧹", color: "pink" },
                    { name: "Landscaping", icon: "🌱", color: "green" },
                    { name: "Tile Work", icon: "⬜", color: "gray" },
                    { name: "Drywall Repair", icon: "🧱", color: "red" },
                    { name: "General Repair", icon: "🛠️", color: "slate" },
                    { name: "Other", icon: "❓", color: "gray" },
                  ].map((category) => (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() =>
                        handleInputChange("category", category.name)
                      }
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-center hover:scale-105 ${
                        formData.category === category.name
                          ? "border-orange-500 bg-orange-50 shadow-lg"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div
                        className={`text-sm font-medium ${
                          formData.category === category.name
                            ? "text-orange-700"
                            : "text-slate-700"
                        }`}
                      >
                        {category.name}
                      </div>
                    </button>
                  ))}
                </div>

                {errors.category && (
                  <p className="mt-2 text-sm text-red-600">
                    ⚠️ {errors.category}
                  </p>
                )}
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  When do you need this done?
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => handleInputChange("urgency", e.target.value)}
                  className="w-full px-4 bg-white py-4 text-lg border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
                >
                  <option value="asap">ASAP (Today/Tomorrow)</option>
                  <option value="week">This week</option>
                  <option value="flexible">I&apos;m flexible</option>
                  <option value="emergency">Emergency (Now!)</option>
                </select>
              </div>

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
                <div className="grid sm:grid-cols-2 gap-4">
                  <select
                    value={formData.budget}
                    onChange={(e) =>
                      handleInputChange("budget", e.target.value)
                    }
                    className="w-full px-4 py-4 text-lg border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white"
                  >
                    <option value="hour">Hourly rate</option>
                    <option value="fixed">Fixed price</option>
                    <option value="quote">Get quotes</option>
                  </select>

                  {formData.budget !== "quote" && (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
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

              {/* Location */}
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="Your address or neighborhood"
                  className="w-full px-4 py-4 text-lg border border-slate-200 bg-white rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Photo Upload */}
              {/* <div> */}
              {/* <label className="block text-lg font-semibold text-slate-800 mb-3">
                  Photos (Optional)
                </label> */}
              {/* <div className="space-y-4"> */}
              {/* Upload Area */}
              {/* <div
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer group ${
                      uploading
                        ? "border-orange-400 bg-orange-50"
                        : "border-slate-300 hover:border-orange-400 hover:bg-orange-50"
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="photo-upload"
                      className={
                        uploading ? "cursor-not-allowed" : "cursor-pointer"
                      }
                    >
                      <div
                        className={`text-5xl mb-4 transition-transform duration-200 ${
                          uploading ? "animate-pulse" : "group-hover:scale-110"
                        }`}
                      >
                        {uploading ? "⏳" : "📸"}
                      </div>
                      <p className="font-semibold text-slate-700 mb-2">
                        {uploading
                          ? "Uploading photos..."
                          : "Add photos to help pros understand your job"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {uploading
                          ? "Please wait"
                          : "Click to upload or drag and drop"}
                      </p>
                    </label>
                  </div> */}

              {/* Photo Preview */}
              {/* {formData.photos.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-600 mb-3">
                        {formData.photos.length} photo(s) uploaded
                      </p>
                      <div className="grid grid-cols-4 gap-4">
                        {formData.photos.map((photoUrl, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={photoUrl}
                              alt={`Upload ${index + 1}`}
                              width={96}
                              height={96}
                              className="w-full h-24 object-cover rounded-xl border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors duration-200"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )} */}

              {/* Upload Status */}
              {/* {uploading && (
                    <div className="text-center py-4">
                      <div className="text-orange-600 font-medium">
                        Uploading photos...
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                        <div className="bg-orange-500 h-2 rounded-full animate-pulse w-1/2"></div>
                      </div>
                    </div>
                  )} */}
              {/* </div> */}
            </div>
            {/* </div> */}

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
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const testJob = {
                          title: "Test Job - Fix Faucet",
                          description:
                            "This is a hardcoded test job for testing purposes. Please ignore.",
                          category: "Plumbing",
                          urgency: "flexible",
                          budget: "hour",
                          budgetAmount: "75",
                          location: "123 Test Street, Testville",
                        };

                        const response = await fetch("/api/jobs", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(testJob),
                        });

                        const data = await response.json();

                        if (data.success) {
                          alert("✅ Test job created successfully!");
                          router.push("/jobs?posted=true");
                        } else {
                          alert("❌ Failed to create test job: " + data.error);
                        }
                      } catch (error) {
                        console.error(error);
                        alert("❌ Error creating test job.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Create Test Job
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
