// components/modals/CompletedJobsModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

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

interface CompletedJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  onArchiveJob: (jobId: number) => void;
  onRestoreJob: (jobId: number) => void;
}

export function CompletedJobsModal({
  isOpen,
  onClose,
  jobs,
  onArchiveJob,
  onRestoreJob,
}: CompletedJobsModalProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [archivingJob, setArchivingJob] = useState<number | null>(null);

  const completedJobs = jobs.filter((job) => job.status === "completed");

  const handleArchiveJob = async (jobId: number) => {
    setArchivingJob(jobId);
    try {
      await onArchiveJob(jobId);
    } finally {
      setArchivingJob(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatEarnings = (job: Job) => {
    if (job.budget === "hour") {
      return `$${job.budgetAmount}/hr`;
    }
    return `$${job.budgetAmount}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Completed Jobs
              </h2>
              <p className="text-slate-600 mt-1">
                {completedJobs.length} jobs completed
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-140px)]">
            {/* Jobs List */}
            <div className="w-1/2 border-r border-slate-200 overflow-y-auto">
              {completedJobs.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="font-semibold text-slate-800 mb-2">
                    No completed jobs yet
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Completed jobs will appear here once you finish them.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {completedJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        selectedJob?.id === job.id
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 hover:border-green-300 hover:bg-green-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-800 text-sm">
                          {job.customerName}
                        </h4>
                        <span className="text-lg font-bold text-green-600">
                          {formatEarnings(job)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-2 truncate">
                        {job.title}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{job.category}</span>
                        <span>
                          Completed{" "}
                          {formatDate(job.completedAt || job.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="w-1/2 overflow-y-auto">
              {selectedJob ? (
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        ✅ Completed
                      </span>
                      <span className="text-2xl font-bold text-slate-800">
                        {formatEarnings(selectedJob)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {selectedJob.title}
                    </h3>
                    <p className="text-slate-600 mb-4">
                      {selectedJob.description}
                    </p>
                  </div>

                  {/* Job Info */}
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Customer</span>
                        <p className="font-semibold text-slate-800">
                          {selectedJob.customerName}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Category</span>
                        <p className="font-semibold text-slate-800">
                          {selectedJob.category}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Location</span>
                        <p className="font-semibold text-slate-800">
                          {selectedJob.location}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Completed</span>
                        <p className="font-semibold text-slate-800">
                          {formatDate(
                            selectedJob.completedAt || selectedJob.createdAt
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-slate-800 mb-3">
                      Timeline
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-slate-600">
                          Posted on {formatDate(selectedJob.createdAt)}
                        </span>
                      </div>
                      {selectedJob.acceptedAt && (
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                          <span className="text-slate-600">
                            Accepted on {formatDate(selectedJob.acceptedAt)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-slate-600">
                          Completed on{" "}
                          {formatDate(
                            selectedJob.completedAt || selectedJob.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleArchiveJob(selectedJob.id)}
                      disabled={archivingJob === selectedJob.id}
                      variant="outline"
                      className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      {archivingJob === selectedJob.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin mr-2"></div>
                          Archiving...
                        </>
                      ) : (
                        <>📦 Archive Job</>
                      )}
                    </Button>
                    <Link
                      href={`/messages?customerId=${
                        selectedJob.postedBy
                      }&customer=${encodeURIComponent(
                        selectedJob.customerName
                      )}&job=${selectedJob.id}&title=${encodeURIComponent(
                        selectedJob.title
                      )}`}
                    >
                      <Button
                        variant="outline"
                        className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        💬 Contact Customer
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <div className="text-4xl mb-4">👈</div>
                  <p>Select a job to view details</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
