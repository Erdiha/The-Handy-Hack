"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { HandymanProfile } from "@/types/handyman";
import Link from "next/link";

export default function HandymanProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<HandymanProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPhone = () => {
    if (profile?.phone) {
      navigator.clipboard.writeText(profile.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchProfile();
    }
  }, [params.id]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/handyman/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setProfile(data.handyman);
      } else {
        setError(data.error || "Handyman not found");
      }
    } catch (error) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Profile Not Found
          </h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button
            onClick={() => router.push("/search")}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-orange-50 pt-16">
      {/* Header Section */}
      <section className="bg-orange-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Info */}
              <div className="lg:col-span-2">
                <div className="flex items-start space-x-6">
                  {/* Avatar */}
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold text-3xl">
                      {profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-slate-800">
                        {profile.name}
                      </h1>
                      {profile.isVerified && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                          ✓ Verified
                        </span>
                      )}
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        🟢 Available
                      </span>
                    </div>

                    <div className="flex items-center space-x-6 text-slate-600 mb-4">
                      <span className="flex items-center">
                        <span className="text-yellow-500 mr-1">⭐</span>
                        <span className="font-semibold">
                          {profile.stats.rating}
                        </span>
                        <span className="ml-1">
                          ({profile.stats.reviewCount} reviews)
                        </span>
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">📍</span>
                        <span>{profile.neighborhood}</span>
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">⏱️</span>
                        <span>
                          Responds in {profile.availability.responseTime}
                        </span>
                      </span>
                    </div>

                    <p className="text-slate-700 text-lg leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="lg:col-span-1  ">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 border border-orange-200 ">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-slate-800 mb-1">
                      ${profile.hourlyRate}
                      <span className="text-xl font-normal text-slate-500">
                        /hour
                      </span>
                    </div>
                    <p className="text-slate-600">Starting rate</p>
                  </div>

                  <div className="space-y-3 flex flex-col">
                    <Link
                      href={`/messages?handyman=${
                        profile.id
                      }&name=${encodeURIComponent(
                        profile.name
                      )}&service=General%20Inquiry`}
                    >
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl">
                        💬 Send Message
                      </Button>
                    </Link>
                    <Link
                      href={`/messages?handyman=${
                        profile.id
                      }&name=${encodeURIComponent(
                        profile.name
                      )}&intent=quote&service=${encodeURIComponent(
                        "Quote Request"
                      )}`}
                    >
                      <Button
                        variant="outline"
                        className="w-full border-2 border-orange-300 text-orange-700 hover:bg-orange-50 font-semibold py-3 rounded-xl"
                      >
                        📋 Request Quote
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-4 pt-4 border-t border-orange-200 text-sm text-slate-600 text-center">
                    <p>💡 All communication through secure platform</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Services & Reviews */}
            <div className="lg:col-span-2 space-y-8">
              {/* Services */}
              <motion.div
                className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                  Services Offered
                </h2>
                <div className="grid gap-4">
                  {profile.services.map((service, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-2xl p-6 hover:border-orange-300 transition-colors duration-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-semibold text-slate-800">
                          {service.name}
                        </h3>
                        <span className="text-lg font-bold text-orange-600">
                          ${service.basePrice}/hr
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Reviews */}
              <motion.div
                className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                  Recent Reviews ({profile.stats.reviewCount})
                </h2>
                <div className="space-y-6">
                  {profile.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-slate-800">
                              {review.customerName}
                            </span>
                            <span className="text-sm text-slate-500">
                              • {review.date}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={
                                    i < review.rating
                                      ? "text-yellow-500"
                                      : "text-slate-300"
                                  }
                                >
                                  ⭐
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {review.serviceType}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Stats & Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats */}
              <motion.div
                className="bg-white rounded-3xl shadow-lg border border-orange-100 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Professional Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Jobs Completed</span>
                    <span className="font-bold text-slate-800">
                      {profile.stats.completedJobs}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Average Rating</span>
                    <span className="font-bold text-slate-800">
                      {profile.stats.rating}/5.0
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Member Since</span>
                    <span className="font-bold text-slate-800">
                      {new Date(profile.joinedDate).getFullYear()}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Availability */}
              <motion.div
                className="bg-white rounded-3xl shadow-lg border border-orange-100 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Availability
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">🟢</span>
                    <span className="text-slate-700">Currently Available</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <div>{profile.availability.workingHours}</div>
                    <div className="mt-1">
                      {profile.availability.weekendAvailable
                        ? "Weekend work available"
                        : "Weekdays only"}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Info
              <motion.div
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Ready to Get Started?
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  Contact {profile.name.split(" ")[0]} directly to discuss your
                  project and get a personalized quote.
                </p>
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl">
                  Start Conversation
                </Button>
              </motion.div> */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
