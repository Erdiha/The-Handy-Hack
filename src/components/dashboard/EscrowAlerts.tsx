"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface EscrowJob {
  jobId: number;
  jobTitle: string;
  jobLocation: string;
  handymanName: string;
  handymanPayout: number;
  completedAt?: string;
  daysSinceCompleted?: number;
  daysSinceAccepted?: number;
}

interface EscrowData {
  summary: {
    totalEscrowed: number;
    totalHandymanPayout: number;
    totalJobs: number;
    readyToReleaseCount: number;
    workInProgressCount: number;
  };
  readyToRelease: EscrowJob[];
  workInProgress: EscrowJob[];
}

interface EscrowAlertsProps {
  onPaymentUpdate?: () => void;
}

export function EscrowAlerts({ onPaymentUpdate }: EscrowAlertsProps) {
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [releasing, setReleasing] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchEscrowAlerts();
  }, []);

  const fetchEscrowAlerts = async () => {
    try {
      const response = await fetch("/api/customer/escrow-alerts");
      const data = await response.json();
      if (data.success) {
        setEscrowData(data);
        // Auto-expand if there are jobs ready to release
        if (data.readyToRelease.length > 0) {
          setIsExpanded(true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch escrow alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async (jobId: number) => {
    console.log("🔥 RELEASE BUTTON CLICKED for job:", jobId); // DEBUG LINE
    setReleasing(jobId);
    setMessage("");

    try {
      console.log("📡 Calling /api/payments/release..."); // DEBUG LINE
      const response = await fetch("/api/payments/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      console.log("📨 Response status:", response.status); // DEBUG LINE
      const data = await response.json();
      console.log("📨 Response data:", data); // DEBUG LINE

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        // Refresh the escrow data to update the UI
        fetchEscrowAlerts();

        // Notify parent component to refresh
        onPaymentUpdate?.();

        // Clear message after 5 seconds
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("❌ Release payment error:", error);
      setMessage("❌ Failed to release payment");
    } finally {
      setReleasing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-blue-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (!escrowData || escrowData.summary.totalJobs === 0) {
    return null; // Don't show anything if no escrowed payments
  }

  const { summary, readyToRelease, workInProgress } = escrowData;
  const hasUrgentActions = readyToRelease.length > 0;
  const urgentJobs = readyToRelease.filter(
    (job) => (job.daysSinceCompleted || 0) >= 2
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-4 shadow-sm ${
        hasUrgentActions
          ? "bg-orange-50 border-orange-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      {/* Success/Error Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.includes("✅")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{message}</span>
            <button
              onClick={() => setMessage("")}
              className="text-xs underline opacity-70 hover:opacity-100"
            >
              dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Alert Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              hasUrgentActions ? "bg-orange-500 animate-pulse" : "bg-blue-500"
            }`}
          ></div>
          <div>
            <h3
              className={`font-semibold ${
                hasUrgentActions ? "text-orange-900" : "text-blue-900"
              }`}
            >
              💰 ${summary.totalEscrowed.toFixed(2)} in Escrow
            </h3>
            <p
              className={`text-sm ${
                hasUrgentActions ? "text-orange-700" : "text-blue-700"
              }`}
            >
              {hasUrgentActions ? (
                <span className="font-medium">
                  🚨 {readyToRelease.length} job
                  {readyToRelease.length !== 1 ? "s" : ""} completed - Release
                  payment now!
                </span>
              ) : (
                `${summary.totalJobs} payment${
                  summary.totalJobs !== 1 ? "s" : ""
                } secured • ${workInProgress.length} in progress`
              )}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="outline"
          size="sm"
          className={`border-2 ${
            hasUrgentActions
              ? "border-orange-300 text-orange-700 hover:bg-orange-100"
              : "border-blue-300 text-blue-700 hover:bg-blue-100"
          }`}
        >
          {isExpanded ? "Hide Details" : "View Details"}
        </Button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4"
          >
            {/* Jobs Ready to Release */}
            {readyToRelease.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-900 text-sm">
                  🎯 Ready to Release ({readyToRelease.length})
                </h4>
                {readyToRelease.map((job) => (
                  <div
                    key={job.jobId}
                    className={`p-3 rounded-lg border-2 ${
                      (job.daysSinceCompleted || 0) >= 2
                        ? "bg-red-50 border-red-200"
                        : "bg-orange-100 border-orange-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {job.jobTitle}
                        </p>
                        <p className="text-sm text-slate-600">
                          {job.handymanName} • {job.jobLocation}
                          {job.daysSinceCompleted &&
                            job.daysSinceCompleted >= 2 && (
                              <span className="ml-2 text-red-600 font-medium">
                                ⚠️ {job.daysSinceCompleted} days waiting
                              </span>
                            )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          ${job.handymanPayout.toFixed(2)}
                        </p>
                        <Button
                          onClick={() => handleReleasePayment(job.jobId)}
                          disabled={releasing === job.jobId}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white text-xs mt-1"
                        >
                          {releasing === job.jobId
                            ? "Releasing..."
                            : "Release Now"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Work in Progress */}
            {workInProgress.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-900 text-sm">
                  🔨 Work in Progress ({workInProgress.length})
                </h4>
                {workInProgress.map((job) => (
                  <div
                    key={job.jobId}
                    className="p-3 bg-blue-100 border border-blue-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {job.jobTitle}
                        </p>
                        <p className="text-sm text-slate-600">
                          {job.handymanName} • {job.jobLocation}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          ${job.handymanPayout.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {job.daysSinceAccepted} days active
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total to be released:</span>
                <span className="font-bold text-slate-900">
                  ${summary.totalHandymanPayout.toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
