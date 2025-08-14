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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    urgency: "flexible",
    budget: "hour",
    budgetAmount: "",
    location: "",
    photos: [] as File[],
  });

  const categories = [
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
  

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...files] }));
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      }
    } catch (error) {
      console.error("Failed to post job:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-50">
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
            className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden"
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
                  className="w-full px-4 py-4 text-lg border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Category & Urgency */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-slate-800 mb-3">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className="w-full px-4 py-4 text-lg border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-slate-800 mb-3">
                    When do you need this done?
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) =>
                      handleInputChange("urgency", e.target.value)
                    }
                    className="w-full px-4 py-4 text-lg border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white"
                  >
                    <option value="asap">ASAP (Today/Tomorrow)</option>
                    <option value="week">This week</option>
                    <option value="flexible">I&apos;m flexible</option>
                    <option value="emergency">Emergency (Now!)</option>
                  </select>
                </div>
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
                  className="w-full px-4 py-4 text-lg border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 resize-none"
                  required
                />
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
                        className="w-full pl-8 pr-4 py-4 text-lg border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
                      />
                    </div>
                  )}
                </div>
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
                  className="w-full px-4 py-4 text-lg border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  Photos (Optional)
                </label>
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-orange-400 transition-all duration-200 cursor-pointer group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">
                        📸
                      </div>
                      <p className="font-semibold text-slate-700 mb-2">
                        Add photos to help pros understand your job
                      </p>
                      <p className="text-sm text-slate-500">
                        Click to upload or drag and drop
                      </p>
                    </label>
                  </div>

                  {/* Photo Preview */}
                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-4">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={URL.createObjectURL(photo)}
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
                  )}
                </div>
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
