"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Job } from "@/types/jobs";
import { PaymentButton } from "@/components/payment/PaymentButton";
import { useRouter } from "next/navigation";

// Custom Select Component (copied from search page)
interface SelectOption {
  value: string;
  label: string;
}

interface ResponsiveSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
}

function ResponsiveSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select...",
}: ResponsiveSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(
    options.find((opt) => opt.value === value) || null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedOption(options.find((opt) => opt.value === value) || null);
  }, [value, options]);

  const handleSelect = (option: SelectOption) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="group" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl 
            text-left text-slate-700 font-medium transition-all duration-200
            hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              isOpen
                ? "border-orange-500 ring-2 ring-orange-500 shadow-lg"
                : "shadow-sm hover:shadow-md"
            }
          `}
        >
          <span
            className={selectedOption ? "text-slate-800" : "text-slate-500"}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <motion.svg
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="h-5 w-5 text-slate-400"
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
            </motion.svg>
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-40 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto"
            >
              <div className="py-2">
                {options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1, delay: index * 0.02 }}
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors duration-150
                      flex items-center justify-between group/item
                      ${
                        selectedOption?.value === option.value
                          ? "bg-orange-50 text-orange-700 font-semibold"
                          : "text-slate-700"
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {selectedOption?.value === option.value && (
                      <svg
                        className="w-5 h-5 text-orange-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedUrgency, setSelectedUrgency] = useState("All");
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.role === "customer") {
      router.push("/dashboard");
    }
  }, [session]);

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

  const urgencyOptions = [
    { value: "All", label: "All Urgency" },
    { value: "emergency", label: "🚨 Emergency" },
    { value: "asap", label: "🔥 ASAP" },
    { value: "week", label: "📅 This Week" },
    { value: "flexible", label: "🕐 Flexible" },
  ];

  if (session?.user?.role === "customer") {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Redirecting to Dashboard...
          </h2>
          <p className="text-slate-600">Manage your jobs from your dashboard</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-[calc(100vh-5rem)]">
      {/* Hero Section */}
      <div className="relative z-10">
        <div className="absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:pt-16 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-4 md:mb-6">
              Available Jobs in
              <span className="block text-orange-600 text-4xl sm:text-5xl lg:text-6xl mt-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">
                Your Area
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
              {session?.user ? `Welcome back, ${session.user.name}! ` : ""}
              Browse local jobs and connect with neighbors who need your skills
            </p>
          </motion.div>

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            {/* Advanced Filters */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm">
              {/* Mobile: Stack vertically, Desktop: Grid layout */}
              <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2  md:gap-4">
                {/* Category Filter */}
                <div className="w-full">
                  <ResponsiveSelect
                    label="Category"
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categories.map((cat) => ({
                      value: cat,
                      label: cat,
                    }))}
                    placeholder="Choose category..."
                  />
                </div>
                {/* Urgency Filter */}
                <div className="w-full">
                  <ResponsiveSelect
                    label="Urgency"
                    value={selectedUrgency}
                    onChange={setSelectedUrgency}
                    options={urgencyOptions}
                    placeholder="Any urgency..."
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 z-0 relative">
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-4 xl:grid-cols-3 lg:gap-8">
          {/* Main Results */}
          <div className="lg:col-span-3 xl:col-span-2">
            {/* Results Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4"
            >
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800">
                  {loading
                    ? "Searching..."
                    : `${filteredJobs.length} Jobs Found`}
                </h2>
                <p className="text-slate-600 mt-1 text-sm md:text-base">
                  Fresh opportunities • Available today
                </p>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                {/* Clear Filters */}
                {(selectedCategory !== "All Categories" ||
                  selectedUrgency !== "All") && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedCategory("All Categories");
                      setSelectedUrgency("All");
                    }}
                    className="px-3 md:px-4 py-2 text-xs md:text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg border border-orange-200 hover:border-orange-300 transition-all duration-200"
                  >
                    Clear Filters
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Results List */}
            <div className="space-y-4 md:space-y-6">
              {loading ? (
                <div className="text-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
                  ></motion.div>
                  <p className="text-slate-600 text-lg">
                    Finding the best jobs for you...
                  </p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white rounded-2xl shadow-sm"
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-slate-600 mb-2 text-lg">No jobs found</p>
                  <p className="text-slate-500">
                    Try adjusting your filters or check back later
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {filteredJobs.map((job, index) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      index={index}
                      currentUserId={session?.user?.id}
                      onJobUpdate={fetchJobs}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 xl:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Add spacer to align with results header */}
              <div className="hidden lg:block h-[70px]"></div>

              {/* Pro Tips */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-orange-500 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 "
              >
                <div className="text-center">
                  <div className="text-3xl mb-3 text-left">💡</div>
                  <h3 className="text-xl font-bold mb-2 text-left">Pro Tips</h3>
                  <div className="space-y-2 text-sm text-orange-100  text-left">
                    <p>• Respond quickly to get more jobs</p>
                    <p>• Include photos in your proposals</p>
                    <p>• Ask clarifying questions</p>
                    <p>• Be transparent about timeline</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

////////// Job Card Component (keeping existing implementation)////////////////////////////////////
function JobCard({
  job,
  index,
  currentUserId,
  onJobUpdate,
}: {
  job: Job;
  index: number;
  currentUserId?: string;
  onJobUpdate: () => void;
}) {
  console.log("🔍 Job data for job", job.id, ":", job);
  const [accepting, setAccepting] = useState(false);

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
        onJobUpdate();
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

  const isOwnJob = currentUserId && job.customerId === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-slate-100/50 overflow-hidden transition-all duration-300 group relative z-0"
    >
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 md:gap-6">
          {/* Content Section */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg md:text-xl font-bold text-slate-800">
                    {job.title}
                  </h3>
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

                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-slate-600 mb-3">
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

              <div className="text-right flex-shrink-0">
                <div className="text-xl md:text-2xl font-bold text-slate-800">
                  {getBudgetDisplay(job)}
                </div>
                <div className="text-xs md:text-sm text-slate-500">
                  {job.responses} responses
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-700 leading-relaxed mb-6 text-sm md:text-base">
              {job.description}
            </p>

            {/* Payment Integration */}
            {(isOwnJob ||
              (job.acceptedBy && job.acceptedBy === currentUserId)) && (
              <div className="mb-4">
                <PaymentButton
                  jobId={job.id}
                  jobTitle={job.title}
                  jobAmount={
                    job.budgetAmount ? parseFloat(job.budgetAmount) : 0
                  }
                  currentUserId={currentUserId}
                  jobPosterId={job.customerId}
                  jobAcceptedBy={job.acceptedBy}
                  jobStatus={job.status}
                  paymentStatus={job.paymentStatus || "unpaid"}
                  onPaymentUpdate={onJobUpdate}
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs md:text-sm text-slate-500">
                Posted by {job.postedBy}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {isOwnJob ? (
                  <Button
                    disabled
                    className="bg-slate-300 text-slate-500 px-4 md:px-6 py-2 rounded-xl font-semibold cursor-not-allowed text-sm"
                  >
                    Your Job
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => handleAcceptJob(job.id)}
                      disabled={accepting}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 md:px-6 py-2 rounded-xl font-semibold text-sm"
                    >
                      {accepting ? "Accepting..." : "Accept Job"}
                    </Button>

                    <Link
                      href={`/messages?handyman=${
                        job.customerId
                      }&name=${encodeURIComponent(
                        job.postedBy
                      )}&service=${encodeURIComponent(job.title)}&jobId=${
                        job.id
                      }`}
                    >
                      <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-4 md:px-6 py-2 rounded-xl font-semibold text-sm">
                        Respond
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
