"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: string;
  budgetAmount?: string;
  urgency: string;
  postedBy: string;
  postedDate: string;
  responses: number;
  photos?: string[];
}

export default function JobsPage() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedUrgency, setSelectedUrgency] = useState("All");

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

  // Mock job data - will be real data later
  const jobs: Job[] = [
    {
      id: "1",
      title: "Fix leaky kitchen faucet",
      description:
        "My kitchen faucet has been dripping for a week now. It seems to be coming from the base where it connects to the sink. I have basic tools but not sure how to fix it properly.",
      category: "Plumbing",
      location: "Highland Park",
      budget: "hour",
      budgetAmount: "75",
      urgency: "week",
      postedBy: "Sarah M.",
      postedDate: "2 hours ago",
      responses: 3,
      photos: [],
    },
    {
      id: "2",
      title: "Install ceiling fan in bedroom",
      description:
        "I bought a ceiling fan from Home Depot and need someone to install it. The electrical box is already there, just need the fan mounted and wired. Fan comes with all hardware.",
      category: "Electrical",
      location: "Eagle Rock",
      budget: "fixed",
      budgetAmount: "150",
      urgency: "flexible",
      postedBy: "Mike D.",
      postedDate: "5 hours ago",
      responses: 1,
      photos: [],
    },
    {
      id: "3",
      title: "Paint living room walls",
      description:
        "Looking to paint my living room (12x15 ft). Walls are currently white, want to change to light gray. I have the paint already, just need someone with experience to do a clean job.",
      category: "Painting",
      location: "Highland Park",
      budget: "quote",
      urgency: "flexible",
      postedBy: "Jennifer L.",
      postedDate: "1 day ago",
      responses: 7,
      photos: [],
    },
    {
      id: "4",
      title: "Emergency: Garage door won't open",
      description:
        "My garage door is completely stuck and won't open. My car is trapped inside and I need to get to work tomorrow. The opener makes noise but door doesn't move.",
      category: "General Repair",
      location: "Silverlake",
      budget: "hour",
      budgetAmount: "100",
      urgency: "asap",
      postedBy: "David K.",
      postedDate: "30 minutes ago",
      responses: 0,
      photos: [],
    },
    {
      id: "5",
      title: "Assemble IKEA dining set",
      description:
        "I have a 6-piece IKEA dining set that needs assembly. Includes table and 4 chairs. All parts and tools are included. Should take 2-3 hours for someone experienced.",
      category: "Furniture Assembly",
      location: "Highland Park",
      budget: "fixed",
      budgetAmount: "120",
      urgency: "week",
      postedBy: "Amanda R.",
      postedDate: "3 hours ago",
      responses: 2,
      photos: [],
    },
  ];

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
      <div className="bg-white border-b border-orange-100">
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

            {/* Job Cards */}
            <div className="space-y-6">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-slate-600 mb-2">
                    No jobs match your filters
                  </p>
                  <p className="text-slate-500">
                    Try adjusting your search criteria
                  </p>
                </div>
              ) : (
                filteredJobs.map((job, index) => (
                  <JobCard key={job.id} job={job} index={index} />
                ))
              )}
            </div>
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
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-3">
                  🎯 Boost Your Profile
                </h3>
                <p className="text-green-100 text-sm mb-4">
                  Complete your profile to get 3x more job responses
                </p>
                <Button className="w-full cursor-pointer text-green-600 hover:bg-green-50 hover:text-black font-bold py-3 rounded-xl">
                  Update Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Job Card Component
function JobCard({ job, index }: { job: Job; index: number }) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
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
            <Button
              variant="outline"
              className="border-2 border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600 px-4 py-2 rounded-xl"
            >
              View Details
            </Button>
            {/* Replace the current Respond button with: */}
            <Link
              href={`/messages?job=${job.id}&customer=${encodeURIComponent(
                job.postedBy
              )}&title=${encodeURIComponent(job.title)}`}
            >
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-semibold">
                Respond
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
