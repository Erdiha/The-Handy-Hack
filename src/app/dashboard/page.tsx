"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { JobDetailsModal } from "@/components/modals/JobDetailsModal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Toast } from "@/components/ui/Toast";
import { RateUpdateModal } from "@/components/modals/RateUpdateModal";
import { ManageServicesModal } from "@/components/modals/ManageServicesModal";
import { SetAvailabilityModal } from "@/components/modals/SetAvailabilityModal";
import { AvailabilityData } from "@/types/availability";
import { CompletedJobsModal } from "@/components/modals/CompletedJobsModal";
import { ArchivedJobsModal } from "@/components/modals/ArchivedJobsModal";
// Remove the old interface and type definitions, just keep this import
interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "handyman";
}

interface UserProfile {
  hasCompletedOnboarding: boolean;
  neighborhood?: string;
  phone?: string;
  bio?: string;
  services?: string[];
  hourlyRate?: string;
}

interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  budget: string;
  budgetAmount: string | null;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  customerName: string;
  postedBy: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      checkOnboardingStatus();
    }
  }, [status, router]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);

        if (!data.hasCompletedOnboarding) {
          router.push("/onboarding");
        }
      }
    } catch (error) {
      console.error("Failed to check profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) return null;

  const isHandyman = session.user.role === "handyman";
  const firstName = session.user.name?.split(" ")[0] || "User";

  return (
    <div className="min-h-[calc(100vh-5rem)]  md:pt-16 bg-orange-50">
      {isHandyman ? (
        <HandymanDashboard
          profile={profile}
          user={session.user as SessionUser}
          firstName={firstName}
        />
      ) : (
        <CustomerDashboard
          profile={profile}
          user={session.user as SessionUser}
          firstName={firstName}
        />
      )}
    </div>
  );
}

function HandymanDashboard({
  profile,
  user,
  firstName,
}: {
  profile: UserProfile;
  user: SessionUser;
  firstName: string;
}) {
  const [myJobs, setMyJobs] = useState<Job[]>([]); // Proper typing
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [currentRate, setCurrentRate] = useState(profile.hourlyRate || "50");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isCompletedJobsModalOpen, setIsCompletedJobsModalOpen] =
    useState(false);
  const [isArchivedJobsModalOpen, setIsArchivedJobsModalOpen] = useState(false);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [archivedJobs, setArchivedJobs] = useState<Job[]>([]);
  const [jobActionLoading, setJobActionLoading] = useState(false);

  const [useScheduledAvailability, setUseScheduledAvailability] =
    useState(false);
  const [currentAvailability, setCurrentAvailability] =
    useState<AvailabilityData>({
      weeklySchedule: {
        Monday: { start: "09:00", end: "17:00", enabled: true },
        Tuesday: { start: "09:00", end: "17:00", enabled: true },
        Wednesday: { start: "09:00", end: "17:00", enabled: true },
        Thursday: { start: "09:00", end: "17:00", enabled: true },
        Friday: { start: "09:00", end: "17:00", enabled: true },
        Saturday: { start: "10:00", end: "16:00", enabled: false },
        Sunday: { start: "10:00", end: "16:00", enabled: false },
      },
      responseTime: "1 hour",
      vacationMode: false,
      vacationUntil: "",
      instantBooking: false,
      emergencyAvailable: true,
      bufferTime: 30,
    });
  const [currentServices, setCurrentServices] = useState<string[]>(
    profile.services || ["Plumbing", "Electrical"] // Default services
  );
  // Add these to your existing state

  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success" as "success" | "error",
  });
  // ADD THESE:
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    jobsToday: 0,
    jobsThisWeek: 0,
    totalCompleted: 0,
  });
  const [earningsLoading, setEarningsLoading] = useState(true);

  useEffect(() => {
    fetchMyJobs();
    fetchEarnings();
    fetchAvailabilityStatus(); // ADD THIS
  }, []);

  const fetchCompletedJobs = async () => {
    try {
      const response = await fetch("/api/jobs/manage?status=completed");
      const data = await response.json();
      if (data.success) {
        setCompletedJobs(data.jobs);
      }
    } catch (error) {
      console.error("Failed to fetch completed jobs:", error);
    }
  };

  const fetchArchivedJobs = async () => {
    try {
      const response = await fetch("/api/jobs/manage?status=archived");
      const data = await response.json();
      if (data.success) {
        setArchivedJobs(data.jobs);
      }
    } catch (error) {
      console.error("Failed to fetch archived jobs:", error);
    }
  };

  const handleArchiveJob = async (jobId: number) => {
    setJobActionLoading(true);
    try {
      const response = await fetch("/api/jobs/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action: "archive" }),
      });

      const data = await response.json();
      if (data.success) {
        await Promise.all([fetchCompletedJobs(), fetchArchivedJobs()]);
        fetchMyJobs();

        setToast({
          isVisible: true,
          message: "Job archived successfully",
          type: "success",
        });
      } else {
        setToast({
          isVisible: true,
          message: data.error || "Failed to archive job",
          type: "error",
        });
      }
    } catch (error) {
      setToast({
        isVisible: true,
        message: "Failed to archive job",
        type: "error",
      });
    } finally {
      setJobActionLoading(false);
    }
  };

  const handleRestoreJob = async (jobId: number) => {
    setJobActionLoading(true);
    try {
      const response = await fetch("/api/jobs/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action: "restore" }),
      });

      const data = await response.json();
      if (data.success) {
        await Promise.all([fetchCompletedJobs(), fetchArchivedJobs()]);
        fetchMyJobs();

        setToast({
          isVisible: true,
          message: "Job restored successfully",
          type: "success",
        });
      }
    } catch (error) {
      setToast({
        isVisible: true,
        message: "Failed to restore job",
        type: "error",
      });
    } finally {
      setJobActionLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    setJobActionLoading(true);
    try {
      const response = await fetch("/api/jobs/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action: "delete" }),
      });

      const data = await response.json();
      if (data.success) {
        fetchArchivedJobs();

        setToast({
          isVisible: true,
          message: "Job deleted permanently",
          type: "success",
        });
      }
    } catch (error) {
      setToast({
        isVisible: true,
        message: "Failed to delete job",
        type: "error",
      });
    } finally {
      setJobActionLoading(false);
    }
  };

  const fetchAvailabilityStatus = async () => {
    try {
      console.log("🔍 Fetching availability status..."); // Debug log

      const response = await fetch("/api/handyman/availability");
      const data = await response.json();

      console.log("📡 Availability API response:", data); // Debug log

      if (data.success && typeof data.isAvailable === "boolean") {
        console.log("✅ Setting isAvailable to:", data.isAvailable); // Debug log
        setIsAvailable(data.isAvailable);
      } else {
        console.warn("⚠️ Unexpected availability API response:", data);
        // Fallback: check profile endpoint
        const profileResponse = await fetch("/api/profile");
        const profileData = await profileResponse.json();

        if (
          profileData.success &&
          typeof profileData.isAvailable === "boolean"
        ) {
          console.log(
            "✅ Setting isAvailable from profile to:",
            profileData.isAvailable
          );
          console.log(
            "✅ Setting useScheduledAvailability from profile to:",
            profileData.useScheduledAvailability
          );
          setIsAvailable(profileData.isAvailable);
          setUseScheduledAvailability(
            profileData.useScheduledAvailability ?? false
          ); // ADD THIS LINE
        } else {
          console.warn("⚠️ No availability data found, defaulting to false");
          setIsAvailable(false);
          setUseScheduledAvailability(false); // ADD THIS LINE
        }
      }
    } catch (error) {
      console.error("❌ Failed to fetch availability:", error);
      setIsAvailable(false); // Default to offline on error
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await fetch("/api/earnings");
      const data = await response.json();
      if (data.success) {
        setEarnings(data.earnings);
      }
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
    } finally {
      setEarningsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const response = await fetch("/api/jobs/my-jobs");
      const data = await response.json();
      if (data.success) {
        setMyJobs(data.jobs);
      }
    } catch (error) {
      console.error("Failed to fetch my jobs:", error);
    } finally {
      setJobsLoading(false);
    }
  };
  const todayEarnings = 245;
  const weeklyGoal = 800;
  const nextJob = {
    customer: "Sarah Martinez",
    service: "Kitchen Faucet Repair",
    time: "2:00 PM",
    location: "142 Pine St",
    payment: 85,
  };

  const handleCompleteJob = async (id: number) => {
    try {
      const response = await fetch(`/api/jobs/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        // 🔧 FIX 4: Use the returned value, not the local calculation
        const returnedAvailability = data.isAvailable;
        console.log("✅ API returned isAvailable:", returnedAvailability);

        setIsAvailable(returnedAvailability);

        setToast({
          isVisible: true,
          message:
            data.message ||
            `Status updated to ${
              returnedAvailability ? "Available" : "Offline"
            }`,
          type: "success",
        });

        // 🔧 FIX 5: Optional: Refetch to ensure sync
        setTimeout(() => {
          fetchAvailabilityStatus();
        }, 500);
      } else {
        console.error("❌ Toggle failed:", data.error);
        setToast({
          isVisible: true,
          message: data.error || "Failed to update availability",
          type: "error",
        });
      }
    } catch (error) {
      setToast({
        isVisible: true,
        message: "Failed to complete job",
        type: "error",
      });
    }
  };

  const handleRateUpdate = (newRate: string) => {
    setCurrentRate(newRate);
    setToast({
      isVisible: true,
      message: "Hourly rate updated successfully",
      type: "success",
    });
  };
  const handleAvailabilityToggle = async () => {
    if (isAvailable === null) return; // Don't toggle if status unknown

    const newAvailabilityState = !isAvailable;
    console.log(
      "🔄 Toggling availability from",
      isAvailable,
      "to",
      newAvailabilityState
    );

    setAvailabilityLoading(true);

    try {
      const response = await fetch("/api/handyman/toggle-availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: newAvailabilityState }),
      });

      const data = await response.json();
      console.log("📡 Toggle API response:", data); // Debug log

      if (data.success) {
        // 🔧 FIX 4: Use the returned value, not the local calculation
        const returnedAvailability = data.isAvailable;
        console.log("✅ API returned isAvailable:", returnedAvailability);

        setIsAvailable(returnedAvailability);

        setToast({
          isVisible: true,
          message:
            data.message ||
            `Status updated to ${
              returnedAvailability ? "Available" : "Offline"
            }`,
          type: "success",
        });

        // 🔧 FIX 5: Optional: Refetch to ensure sync
        setTimeout(() => {
          fetchAvailabilityStatus();
        }, 500);
      } else {
        console.error("❌ Toggle failed:", data.error);
        setToast({
          isVisible: true,
          message: data.error || "Failed to update availability",
          type: "error",
        });
      }
    } catch (error) {
      console.error("❌ Toggle request failed:", error);
      setToast({
        isVisible: true,
        message: "Failed to update availability",
        type: "error",
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Add this component inside HandymanDashboard function, before the return statement
  const JobItem = ({ job }: { job: Job }) => (
    <div className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-100 mb-5">
      <div>
        <h4 className="font-medium text-slate-900 text-lg">
          {job.customerName}
        </h4>
        <p className="text-slate-600">{job.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full ${
              job.status === "completed"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {job.status}
          </span>
          {job.acceptedAt && (
            <span className="text-xs text-slate-500">
              Accepted {new Date(job.acceptedAt).toLocaleDateString()}
            </span>
          )}
          {job.completedAt && (
            <span className="text-xs text-slate-500">
              Completed {new Date(job.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-slate-500 text-sm">{job.location}</span>
        {job.budgetAmount && (
          <span className="text-xl font-bold text-slate-900">
            {job.budget === "hour"
              ? `$${job.budgetAmount}/hr`
              : `$${job.budgetAmount}`}
          </span>
        )}
      </div>

      <div className="flex space-x-3 pt-3">
        {job.status === "completed" ? (
          <Button
            disabled
            className="flex-1 bg-gray-300 text-gray-500 cursor-not-allowed"
          >
            ✓ Job Completed
          </Button>
        ) : (
          <Button
            onClick={() => handleCompleteJob(job.id)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
          >
            Complete Job
          </Button>
        )}

        <Button
          onClick={() => {
            setSelectedJob(job);
            setIsModalOpen(true);
          }}
          variant="outline"
          className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          View Details
        </Button>
      </div>
    </div>
  );
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 bg-orange-50">
      {/* Header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 capitalize">
              Good morning, {firstName}
            </h1>
            <p className="text-slate-600 text-lg">
              Let&apos;s make today productive in {profile.neighborhood}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {isAvailable === null ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
                <span className="text-slate-500 font-medium">
                  Loading status...
                </span>
              </div>
            ) : (
              <>
                <div
                  className={`w-3 h-3 rounded-full ${
                    isAvailable ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-slate-600 font-medium">
                  {isAvailable ? "Available" : "Offline"}
                </span>
                <Button
                  onClick={handleAvailabilityToggle}
                  disabled={availabilityLoading || isAvailable === null}
                  variant="outline"
                  className="ml-4 border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  {availabilityLoading
                    ? "Updating..."
                    : isAvailable
                    ? "Go Offline"
                    : "Go Online"}
                </Button>
              </>
            )}
          </div>

          {/* FUTURE: Scheduling feature - commented out for now
<div className="flex items-center space-x-2 pl-4 border-l border-slate-300">
  <label className="flex items-center space-x-2 cursor-pointer">
    <input
      type="checkbox"
      checked={useScheduledAvailability}
      onChange={(e) => setUseScheduledAvailability(e.target.checked)}
      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <span className="text-slate-600 font-medium">Use Schedule</span>
  </label>
</div>
*/}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Primary Focus Area */}
        <motion.div
          className="lg:col-span-8 space-y-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Today's Earnings - Hero Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            {earningsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-slate-500">Loading earnings...</p>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-2">
                      TODAY&apos;S EARNINGS
                    </p>
                    <h2 className="text-5xl font-bold text-slate-900">
                      ${earnings.today}
                    </h2>
                    {earnings.today > 0 && (
                      <p className="text-green-600 text-sm font-medium mt-2">
                        Great work today!
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-sm">Weekly Goal</p>
                    <p className="text-2xl font-semibold text-slate-700">
                      ${weeklyGoal}
                    </p>
                    <div className="w-32 h-2 bg-slate-200 rounded-full mt-2">
                      <div
                        className="h-2 bg-slate-900 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (earnings.week / weeklyGoal) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-8 text-sm">
                  <div>
                    <span className="text-slate-500">Jobs Today</span>
                    <span className="ml-2 font-semibold text-slate-900">
                      {earnings.jobsToday}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Completed</span>
                    <span className="ml-2 font-semibold text-slate-900">
                      {earnings.totalCompleted}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">This Week</span>
                    <span className="ml-2 font-semibold text-slate-900">
                      ${earnings.week}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* My Jobs - Real Data */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-auto max-h-[55vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">My Jobs</h3>
              <span className="text-slate-500 text-sm">
                {myJobs.filter((job) => job.status !== "completed").length}{" "}
                active
              </span>
            </div>

            {jobsLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-slate-500 text-sm">Loading jobs...</p>
              </div>
            ) : myJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">No active jobs</p>
                <Link href="/jobs">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Browse Available Jobs
                  </Button>
                </Link>
              </div>
            ) : (
              <div className=" min-h-fit overflow-y-auto space-y-4">
                {/* Active Jobs */}
                {myJobs
                  .filter((job) => job.status === "accepted")
                  .sort(
                    (a, b) =>
                      new Date(a.acceptedAt || a.createdAt).getTime() -
                      new Date(b.acceptedAt || b.createdAt).getTime()
                  )
                  .map((job) => (
                    <JobItem key={job.id} job={job} />
                  ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          className="lg:col-span-4 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                onClick={() => setIsRateModalOpen(true)}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 justify-start"
              >
                Update My Rate (${currentRate}/hr)
              </Button>
              <Button
                onClick={() => setIsServicesModalOpen(true)}
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 justify-start"
              >
                Manage Services ({currentServices.length})
              </Button>

              {/* FUTURE: Set Availability scheduling feature - commented out for now
  <Button
    onClick={() => setIsAvailabilityModalOpen(true)}
    disabled={!useScheduledAvailability}
    variant="outline"
    className={`w-full justify-start ${
      useScheduledAvailability
        ? "border-slate-300 text-slate-700 hover:bg-slate-50"
        : "border-slate-200 text-slate-400 cursor-not-allowed"
    }`}
  >
    {useScheduledAvailability
      ? `Set Availability (${currentAvailability.responseTime})`
      : "Set Availability (Enable schedule first)"}
  </Button>
  */}
            </div>
          </div>

          {/* This Week Summary */}
          {/* This Week Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">This Week</h3>
            {earningsLoading ? (
              <div className="space-y-4">
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Earned</span>
                  <span className="font-semibold text-slate-900">
                    ${earnings.week}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Jobs Completed</span>
                  <span className="font-semibold text-slate-900">
                    {earnings.jobsThisWeek}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Avg Job Value</span>
                  <span className="font-semibold text-slate-900">
                    $
                    {earnings.jobsThisWeek > 0
                      ? Math.round(earnings.week / earnings.jobsThisWeek)
                      : 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4">
            <h3 className="font-semibold mb-3">Job Management</h3>

            {/* Completed Jobs Summary */}
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 text-sm">Completed Jobs</span>
                <span className="text-white font-bold">
                  {myJobs.filter((job) => job.status === "completed").length}
                </span>
              </div>
              <Button
                onClick={() => {
                  setIsCompletedJobsModalOpen(true);
                  fetchCompletedJobs();
                }}
                variant="outline"
                className="w-full text-xs py-2 border-slate-600 font-semibold text-slate-500 hover:bg-slate-700 hover:text-white"
              >
                View Completed Jobs
              </Button>
            </div>

            {/* Archived Jobs */}
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 text-sm">Archived Jobs</span>
                <span className="text-white font-bold">
                  {archivedJobs.length}
                </span>
              </div>
              <Button
                onClick={() => {
                  setIsArchivedJobsModalOpen(true);
                  fetchArchivedJobs();
                }}
                variant="outline"
                className="w-full text-xs py-2 border-slate-600 text-slate-500 font-semibold hover:bg-slate-700 hover:text-white"
              >
                View Archived Jobs
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
      {/* Job Details Modal */}
      <JobDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
      />
      <RateUpdateModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        currentRate={currentRate}
        onUpdate={handleRateUpdate}
      />
      {/* Manage Services Modal */}
      <ManageServicesModal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
        currentServices={currentServices}
        onUpdate={(services) => {
          setCurrentServices(services);
          setToast({
            isVisible: true,
            message: `Services updated! Now offering ${services.length} services.`,
            type: "success",
          });
        }}
      />
      {/* Set Availability Modal */}
      <SetAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        currentAvailability={currentAvailability}
        onUpdate={(availability) => {
          setCurrentAvailability(availability);
          setToast({
            isVisible: true,
            message: "Availability updated successfully!",
            type: "success",
          });
        }}
      />
      <CompletedJobsModal
        isOpen={isCompletedJobsModalOpen}
        onClose={() => setIsCompletedJobsModalOpen(false)}
        jobs={completedJobs}
        onArchiveJob={handleArchiveJob}
        onRestoreJob={handleRestoreJob}
      />

      {/* Archived Jobs Modal */}
      <ArchivedJobsModal
        isOpen={isArchivedJobsModalOpen}
        onClose={() => setIsArchivedJobsModalOpen(false)}
        jobs={archivedJobs}
        onRestoreJob={handleRestoreJob}
        onDeleteJob={handleDeleteJob}
      />
    </div>
  );
}

// CUSTOMER DASHBOARD - Clean & Focused
function CustomerDashboard({
  profile,
  user,
  firstName,
}: {
  profile: UserProfile;
  user: SessionUser;
  firstName: string;
}) {
  const hasBookings = false;
  const favoriteHandymen = [
    {
      name: "Mike Rodriguez",
      service: "Plumbing",
      available: true,
      rating: 4.9,
    },
    {
      name: "Carlos Martinez",
      service: "Painting",
      available: false,
      rating: 4.7,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 bg-orange-50">
      {/* Header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2 capitalize">
          Hi {firstName}, what needs fixing?
        </h1>
        <p className="text-slate-600 text-lg">
          Find trusted help in {profile.neighborhood}
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <motion.div
          className="lg:col-span-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {hasBookings ? (
            // Show current bookings
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Your Current Booking
              </h2>
              {/* Booking details would go here */}
            </div>
          ) : (
            // Empty state - focus on finding help
            <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <div className="w-8 h-8 bg-slate-400 rounded-lg"></div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Ready to get something fixed?
                </h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Browse trusted handymen in your neighborhood or get emergency
                  help within 15 minutes.
                </p>

                <div className="space-y-3">
                  <Link href="/search" className="block">
                    <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 py-4 text-lg">
                      Find Local Help
                    </Button>
                  </Link>
                  <Button variant="danger" className="w-full py-4 text-lg">
                    Emergency Help (15 min)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          className="lg:col-span-4 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Your Trusted Pros */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">
              Your Trusted Pros
            </h3>

            {favoriteHandymen.length > 0 ? (
              <div className="space-y-3">
                {favoriteHandymen.map((handyman, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {handyman.name}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {handyman.service} • {handyman.rating}
                        </p>
                      </div>
                    </div>
                    {handyman.available ? (
                      <Button
                        size="sm"
                        className="bg-slate-900 text-white hover:bg-slate-800 text-xs px-3"
                      >
                        Book
                      </Button>
                    ) : (
                      <span className="text-slate-400 text-xs">Busy</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">
                Once you book handymen, your favorites will appear here.
              </p>
            )}
          </div>

          {/* Account Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Account</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Jobs</span>
                <span className="font-semibold text-slate-900">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">This Month</span>
                <span className="font-semibold text-slate-900">$245</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Saved vs TaskRabbit</span>
                <span className="font-semibold text-green-600">~$89</span>
              </div>
            </div>
          </div>

          {/* Neighborhood Activity */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-3">In Your Area</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">Jobs this week</span>
                <span>23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Avg response</span>
                <span>18 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Available pros</span>
                <span>12</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
