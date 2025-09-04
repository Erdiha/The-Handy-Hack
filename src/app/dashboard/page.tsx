"use client";
//app/dashboard/page
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
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
import { CustomerJobDetailsModal } from "@/components/modals/CustomerJobDetailsModal";
import { EmergencyAlertModal } from "@/components/modals/EmergencyAlertModal";
import { PaymentButton } from "@/components/payment/PaymentButton";
import { EscrowAlerts } from "@/components/dashboard/EscrowAlerts";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "handyman";
}

export interface CustomerJob {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: string;
  budgetAmount?: string;
  status: string;
  urgency: string;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  paymentStatus?: string;
  handyman?: {
    id: string;
    name: string;
    phone?: string;
  };
  responses?: number;
}

interface TrustedHandyman {
  id: string;
  name: string;
  service: string;
  rating: number;
  jobCount: number;
  available: boolean;
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      console.log("🔍 [CUSTOMER] Fetching availability status...");
      const response = await fetch("/api/customer/availability");
      const data = await response.json();

      console.log("📡 [CUSTOMER] API Response:", data);

      if (data.success && typeof data.isAvailable === "boolean") {
        console.log("✅ [CUSTOMER] Setting isAvailable to:", data.isAvailable);
        setIsAvailable(data.isAvailable);
      } else {
        console.warn("⚠️ [CUSTOMER] API failed, defaulting to true");
        setIsAvailable(true);
      }
    } catch (error) {
      console.error("❌ [CUSTOMER] Failed to fetch availability:", error);
      setIsAvailable(true);
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
        const returnedAvailability = data.isAvailable;
        console.log("✅ API returned isAvailable:", returnedAvailability);

        setIsAvailable(returnedAvailability);

        // Refresh jobs list
        await fetchMyJobs();

        setToast({
          isVisible: true,
          message: data.message || "Job completed successfully",
          type: "success",
        });

        // Fix: Use the same timeout cleanup pattern
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          fetchAvailabilityStatus();
          timeoutRef.current = null;
        }, 500);
      } else {
        console.error("❌ Complete job failed:", data.error);
        setToast({
          isVisible: true,
          message: data.error || "Failed to complete job",
          type: "error",
        });
      }
    } catch (error) {
      console.error("❌ Complete job request failed:", error);
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
  // Add this ref at the top of HandymanDashboard component

  // Replace handleAvailabilityToggle function
  const handleAvailabilityToggle = async () => {
    if (isAvailable === null) return;

    const newAvailabilityState = !isAvailable;
    console.log(
      "🔄 [CUSTOMER] Toggling from",
      isAvailable,
      "to",
      newAvailabilityState
    );
    setAvailabilityLoading(true);

    try {
      const response = await fetch("/api/customer/toggle-availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: newAvailabilityState }),
      });

      const data = await response.json();
      console.log("📡 [CUSTOMER] Toggle response:", data);

      if (data.success) {
        console.log("✅ [CUSTOMER] Successfully updated to:", data.isAvailable);
        setIsAvailable(data.isAvailable);
      }
    } catch (error) {
      console.error("❌ [CUSTOMER] Failed to toggle:", error);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Add cleanup useEffect
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
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
          {/* <div className="flex items-center space-x-3">
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
          </div> */}

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

function CustomerDashboard({
  profile,
  user,
  firstName,
}: {
  profile: UserProfile;
  user: SessionUser;
  firstName: string;
}) {
  // State declarations
  const [stats, setStats] = useState({
    totalJobs: 0,
    thisMonthSpending: 0,
    estimatedSavings: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [customerJobs, setCustomerJobs] = useState<CustomerJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [trustedHandymen, setTrustedHandymen] = useState<TrustedHandyman[]>([]);
  const [handymenLoading, setHandymenLoading] = useState(true);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CustomerJob | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "archived">(
    "active"
  );
  const [neighborhoodStats, setNeighborhoodStats] = useState({
    jobsThisWeek: 0,
    avgResponseTime: "",
    availableHandymen: 0,
    neighborhood: "Your area",
  });
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [allCustomerJobs, setAllCustomerJobs] = useState<CustomerJob[]>([]);

  // All functions
  const fetchAvailabilityStatus = async () => {
    try {
      const response = await fetch("/api/customer/availability");
      const data = await response.json();

      if (data.success && typeof data.isAvailable === "boolean") {
        setIsAvailable(data.isAvailable);
      } else {
        setIsAvailable(true);
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error);
      setIsAvailable(true);
    }
  };

  const handleAvailabilityToggle = async () => {
    if (isAvailable === null) return;

    const newAvailabilityState = !isAvailable;
    setAvailabilityLoading(true);

    try {
      const response = await fetch("/api/customer/toggle-availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: newAvailabilityState }),
      });

      const data = await response.json();
      if (data.success) {
        setIsAvailable(data.isAvailable);
      }
    } catch (error) {
      console.error("Failed to toggle availability:", error);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const fetchNeighborhoodStats = async () => {
    try {
      const response = await fetch("/api/customer/neighborhood-stats");
      const data = await response.json();
      if (data.success) {
        setNeighborhoodStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch neighborhood stats:", error);
    } finally {
      setNeighborhoodLoading(false);
    }
  };

  const fetchTrustedHandymen = async () => {
    try {
      const response = await fetch("/api/customer/trusted-handymen");
      const data = await response.json();
      if (data.success) {
        setTrustedHandymen(data.trustedHandymen);
      }
    } catch (error) {
      console.error("Failed to fetch trusted handymen:", error);
    } finally {
      setHandymenLoading(false);
    }
  };

  const fetchCustomerJobs = async () => {
    try {
      const response = await fetch(`/api/customer/jobs?status=all`); // Always fetch all
      const data = await response.json();
      if (data.success) {
        setAllCustomerJobs(data.jobs); // Store full dataset
        setCustomerJobs(data.jobs); // Initialize display data
      }
    } catch (error) {
      console.error("Failed to fetch customer jobs:", error);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/customer/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCustomerJobs(); // Add this line
    fetchTrustedHandymen();
    fetchNeighborhoodStats();
  }, []);

  useEffect(() => {
    fetchAvailabilityStatus();
  }, []);

  // useEffect(() => {
  //   if (activeTab) {
  //     setJobsLoading(true);
  //     fetchCustomerJobs();
  //   }
  // }, [activeTab]);

  // Filter jobs based on active tab
  const getFilteredJobs = () => {
    switch (activeTab) {
      case "active":
        return allCustomerJobs.filter(
          (job) => job.status === "open" || job.status === "accepted"
        );
      case "archived":
        return allCustomerJobs.filter((job) => job.status === "archived");
      case "all":
      default:
        return allCustomerJobs;
    }
  };

  const filteredJobs = getFilteredJobs();

  // Tab configuration
  const tabs = [
    {
      key: "active" as const,
      label: "Active Jobs",
      count: allCustomerJobs.filter(
        (j) => j.status === "open" || j.status === "accepted"
      ).length,
    },
    { key: "all" as const, label: "All Jobs", count: allCustomerJobs.length },
    {
      key: "archived" as const,
      label: "Archived",
      count: allCustomerJobs.filter((j) => j.status === "archived").length,
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 capitalize">
              Hi {firstName}, what needs fixing?
            </h1>
            <p className="text-slate-600 text-lg">
              Find trusted help in {profile.neighborhood}
            </p>
          </div>

          {/* Customer availability toggle */}
          {/* <div className=" items-center space-x-3 hidden">
            {isAvailable === null ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
                <span className="text-slate-500 font-medium">Loading...</span>
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
                  disabled={availabilityLoading}
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
          </div> */}
        </div>
      </motion.div>
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <EscrowAlerts />
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <motion.div
          className="lg:col-span-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Tabbed Jobs Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tab Headers */}
            <div className="border-b border-slate-200">
              <div className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-orange-500 text-orange-600 bg-orange-50"
                        : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {jobsLoading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-slate-500">Loading jobs...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="font-semibold text-slate-800 mb-2">
                    No {activeTab} jobs found
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {activeTab === "active" &&
                      "Post your first job to get started!"}
                    {activeTab === "archived" &&
                      "Archived jobs will appear here."}
                    {activeTab === "all" && "You haven't posted any jobs yet."}
                  </p>
                  {activeTab === "active" && (
                    <div className="space-y-3">
                      <Link href="/search" className="block">
                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 py-4 text-lg">
                          Find Local Help
                        </Button>
                      </Link>
                      <Button
                        onClick={() => setIsEmergencyModalOpen(true)}
                        variant="danger"
                        className="w-full py-4 text-lg"
                      >
                        Emergency Help (15 min)
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-slate-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedJob(job);
                        setIsJobModalOpen(true);
                      }}
                    >
                      <h3 className="font-medium text-slate-900">
                        {job.title}
                      </h3>
                      <p className="text-slate-600 text-sm">
                        {job.status} • {job.category}
                        {job.status === "completed" && " • ✅ Completed"}
                        {job.status === "cancelled" && " • ✗ Cancelled"}
                        {job.status === "archived" && " • 📦 Archived"}
                      </p>
                      {job.handyman && (
                        <p className="text-slate-500 text-sm">
                          Handyman: {job.handyman.name}
                        </p>
                      )}

                      {/* ADD PAYMENT BUTTON HERE */}
                      <div
                        className="mt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PaymentButton
                          jobId={job.id}
                          jobTitle={job.title}
                          jobAmount={parseFloat(job.budgetAmount || "0")}
                          currentUserId={user.id}
                          jobPosterId={user.id} // Customer is always the poster
                          jobAcceptedBy={job.handyman?.id}
                          jobStatus={job.status}
                          paymentStatus={job.paymentStatus || "unpaid"}
                          onPaymentUpdate={fetchCustomerJobs}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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

            {handymenLoading ? (
              <div className="text-center py-4">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-slate-500 text-sm">Loading...</p>
              </div>
            ) : trustedHandymen.length > 0 ? (
              <div className="space-y-3">
                {trustedHandymen.map((handyman, index) => (
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
                          {handyman.service} • {handyman.rating?.toFixed(1)} •{" "}
                          {handyman.jobCount} jobs
                        </p>
                      </div>
                    </div>
                    {handyman.available ? (
                      <Link
                        href={`/messages?handyman=${
                          handyman.id
                        }&name=${encodeURIComponent(
                          handyman.name
                        )}&service=General%20Inquiry`}
                      >
                        <Button
                          size="sm"
                          className="bg-slate-900 text-white hover:bg-slate-800 text-xs px-3"
                        >
                          Book
                        </Button>
                      </Link>
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
                <span className="font-semibold text-slate-900">
                  {statsLoading ? "..." : stats.totalJobs}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">This Month</span>
                <span className="font-semibold text-slate-900">
                  {statsLoading ? "..." : `$${stats.thisMonthSpending}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Saved vs TaskRabbit</span>
                <span className="font-semibold text-green-600">
                  {statsLoading ? "..." : `~$${stats.estimatedSavings}`}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-3">
              In {neighborhoodStats.neighborhood}
            </h3>
            {neighborhoodLoading ? (
              <div className="space-y-3 text-sm">
                <div className="h-4 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Jobs this week</span>
                  <span>{neighborhoodStats.jobsThisWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Avg response</span>
                  <span>{neighborhoodStats.avgResponseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Available pros</span>
                  <span>{neighborhoodStats.availableHandymen}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <CustomerJobDetailsModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        job={selectedJob}
        onJobUpdate={fetchCustomerJobs}
      />

      <EmergencyAlertModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
    </div>
  );
}
