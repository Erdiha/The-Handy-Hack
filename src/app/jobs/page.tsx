"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Job } from "@/types/jobs";

export default function JobsPage() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedUrgency, setSelectedUrgency] = useState("All");
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory, selectedUrgency]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All Categories") {
        params.append("category", selectedCategory);
      }
      if (selectedUrgency !== "All") {
        params.append("urgency", selectedUrgency);
      }

      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();

      console.log("🔍 Jobs fetched:", data.jobs?.length, "jobs");
      console.log(
        "🔍 Emergency jobs:",
        data.jobs?.filter((job: Job) => job.urgency === "emergency")
      );

      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "All Categories",
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
  ];

  // Filter out jobs posted by current user AND apply other filters
  const filteredJobs = jobs.filter((job) => {
    const matchesCategory =
      selectedCategory === "All Categories" ||
      job.category === selectedCategory;
    const matchesUrgency =
      selectedUrgency === "All" || job.urgency === selectedUrgency;

    return matchesCategory && matchesUrgency;
  });
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-orange-50">
      {/* Header */}
      <div className="bg-orange-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-4">
                Available Jobs
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Browse local jobs and connect with neighbors who need your
                skills
              </p>
            </div>

            {/* Filters */}
            <div className="max-w-4xl mx-auto">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div className="sm:col-span-1 lg:col-span-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white text-slate-700"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Urgency Filter */}
                <div>
                  <select
                    value={selectedUrgency}
                    onChange={(e) => setSelectedUrgency(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white text-slate-700"
                  >
                    <option value="All">All Urgency</option>
                    <option value="emergency">🚨 Emergency</option>
                    <option value="asap">🔥 ASAP</option>
                    <option value="week">📅 This Week</option>
                    <option value="flexible">🕐 Flexible</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Jobs List */}
          <div className="lg:col-span-2">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {filteredJobs.length} Jobs Available
                </h2>
                <p className="text-slate-600">
                  Fresh opportunities in your area
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6"
                  >
                    <div className="animate-pulse">
                      <div className="h-6 bg-slate-200 rounded mb-4 w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded mb-2 w-1/2"></div>
                      <div className="h-20 bg-slate-200 rounded mb-4"></div>
                      <div className="h-10 bg-slate-200 rounded w-32"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Job Cards */
              <div className="space-y-6">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-slate-600 mb-2">
                      No jobs match your filters
                    </p>
                    <p className="text-slate-500">
                      Try adjusting your search criteria
                    </p>
                  </div>
                ) : (
                  filteredJobs.map((job, index) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      index={index}
                      currentUserId={session?.user?.id}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-3xl shadow-lg border border-orange-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  💼 Today&apos;s Opportunities
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">New jobs</span>
                    <span className="font-bold text-blue-600">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">High priority</span>
                    <span className="font-bold text-red-600">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">In your area</span>
                    <span className="font-bold text-green-600">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Avg budget</span>
                    <span className="font-bold text-slate-800">$85/hr</span>
                  </div>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-3">💡 Pro Tips</h3>
                <div className="space-y-3 text-sm">
                  <p className="text-blue-100">
                    • Respond quickly to get more jobs
                  </p>
                  <p className="text-blue-100">
                    • Include photos in your proposals
                  </p>
                  <p className="text-blue-100">• Ask clarifying questions</p>
                  <p className="text-blue-100">
                    • Be transparent about timeline
                  </p>
                </div>
              </div>

              {/* Profile Completion */}
              {/* <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-3">
                  🎯 Boost Your Profile
                </h3>
                <p className="text-green-100 text-sm mb-4">
                  Complete your profile to get 3x more job responses
                </p>
                <Button className="w-full cursor-pointer text-green-600 hover:bg-green-50 hover:text-black font-bold py-3 rounded-xl">
                  Update Profile
                </Button>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Job Card Component
function JobCard({
  job,
  index,
  currentUserId,
}: {
  job: Job;
  index: number;
  currentUserId?: string;
}) {
  const [accepting, setAccepting] = useState(false); // ADD THIS

  // ADD THIS FUNCTION:
  const handleAcceptJob = async (jobId: string) => {
    if (accepting) return;

    setAccepting(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/accept`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        alert("Job accepted successfully!");
        // Refresh the page to update job list
        window.location.reload();
      } else {
        alert(data.error || "Failed to accept job");
      }
    } catch (error) {
      alert("Failed to accept job");
    } finally {
      setAccepting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "asap":
        return "bg-red-100 text-red-800 border-red-200";
      case "emergency":
        return "bg-red-200 text-red-900 border-red-300";
      case "week":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case "asap":
        return "🔥 ASAP";
      case "emergency":
        return "🚨 Emergency";
      case "week":
        return "📅 This Week";
      default:
        return "🕐 Flexible";
    }
  };

  const getBudgetDisplay = (job: Job) => {
    if (job.budget === "quote") return "Get quotes";
    if (job.budget === "hour") return `$${job.budgetAmount}/hr`;
    return `$${job.budgetAmount} fixed`;
  };

  // Check if this is the user's own job
  const isOwnJob = currentUserId && job.customerId === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.001,
        ease: "easeInOut",
      }}
      className="bg-white rounded-3xl shadow-lg hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-slate-800">{job.title}</h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getUrgencyColor(
                  job.urgency
                )}`}
              >
                {getUrgencyText(job.urgency)}
              </span>
              {isOwnJob && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  Your Job
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
              <span className="flex items-center gap-1">
                <span>📍</span>
                <span>{job.location}</span>
              </span>
              <span className="flex items-center gap-1">
                <span>🏷️</span>
                <span>{job.category}</span>
              </span>
              <span className="flex items-center gap-1">
                <span>🕐</span>
                <span>{job.postedDate}</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-slate-800">
              {getBudgetDisplay(job)}
            </div>
            <div className="text-sm text-slate-500">
              {job.responses} responses
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-700 leading-relaxed mb-6">{job.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">Posted by {job.postedBy}</div>

          <div className="flex gap-3">
            {isOwnJob ? (
              <Button
                disabled
                className="bg-slate-300 text-slate-500 px-6 py-2 rounded-xl font-semibold cursor-not-allowed"
              >
                Your Job
              </Button>
            ) : (
              <>
                {/* Accept Job Button */}
                <Button
                  onClick={() => handleAcceptJob(job.id)}
                  disabled={accepting}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-xl font-semibold"
                >
                  {accepting ? "Accepting..." : "Accept Job"}
                </Button>

                {/* Respond Button */}
                <Link
                  href={`/messages?handyman=${
                    job.customerId
                  }&name=${encodeURIComponent(
                    job.postedBy
                  )}&service=${encodeURIComponent(job.title)}&jobId=${job.id}`}
                >
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-semibold">
                    Respond
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
