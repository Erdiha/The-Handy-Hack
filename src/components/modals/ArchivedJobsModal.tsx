// components/modals/ArchivedJobsModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

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
  archivedAt?: string | null;
  customerName: string;
}

interface ArchivedJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  onRestoreJob: (jobId: number) => void;
  onDeleteJob: (jobId: number) => void;
}

export function ArchivedJobsModal({
  isOpen,
  onClose,
  jobs,
  onRestoreJob,
  onDeleteJob,
}: ArchivedJobsModalProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [restoringJob, setRestoringJob] = useState<number | null>(null);
  const [deletingJob, setDeletingJob] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );

  const archivedJobs = jobs.filter((job) => job.status === "archived");

  const handleRestoreJob = async (jobId: number) => {
    setRestoringJob(jobId);
    try {
      await onRestoreJob(jobId);
      setSelectedJob(null); // Clear selection after restore
    } finally {
      setRestoringJob(null);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    setDeletingJob(jobId);
    try {
      await onDeleteJob(jobId);
      setSelectedJob(null); // Clear selection after delete
      setShowDeleteConfirm(null);
    } finally {
      setDeletingJob(null);
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

  const getJobDuration = (job: Job) => {
    if (!job.acceptedAt || !job.completedAt) return "N/A";
    const start = new Date(job.acceptedAt);
    const end = new Date(job.completedAt);
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays === 1 ? "1 day" : `${diffDays} days`;
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
                Archived Jobs
              </h2>
              <p className="text-slate-600 mt-1">
                {archivedJobs.length} jobs archived
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
              {archivedJobs.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="font-semibold text-slate-800 mb-2">
                    No archived jobs yet
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Completed jobs you archive will appear here for future
                    reference.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {archivedJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        selectedJob?.id === job.id
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-800 text-sm">
                          {job.customerName}
                        </h4>
                        <span className="text-lg font-bold text-slate-600">
                          {formatEarnings(job)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-2 truncate">
                        {job.title}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{job.category}</span>
                        <span>
                          Archived{" "}
                          {formatDate(
                            job.archivedAt || job.completedAt || job.createdAt
                          )}
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
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                        📦 Archived
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
                        <span className="text-slate-500">Duration</span>
                        <p className="font-semibold text-slate-800">
                          {getJobDuration(selectedJob)}
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
                      <div>
                        <span className="text-slate-500">Archived</span>
                        <p className="font-semibold text-slate-800">
                          {formatDate(
                            selectedJob.archivedAt || selectedJob.createdAt
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
                      <div className="flex items-center text-sm">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                        <span className="text-slate-600">
                          Archived on{" "}
                          {formatDate(
                            selectedJob.archivedAt || selectedJob.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleRestoreJob(selectedJob.id)}
                        disabled={restoringJob === selectedJob.id}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        {restoringJob === selectedJob.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Restoring...
                          </>
                        ) : (
                          <>↩️ Restore Job</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 min-w-fit"
                      >
                        💬 Contact Customer
                      </Button>
                    </div>

                    {/* Delete Confirmation */}
                    {showDeleteConfirm === selectedJob.id ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <h4 className="font-semibold text-red-800 mb-2">
                          Remove Job from Your Data?
                        </h4>
                        <p className="text-red-600 text-sm mb-4">
                          You won&apos;t see this job anymore, but records are
                          preserved for business purposes.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleDeleteJob(selectedJob.id)}
                            disabled={deletingJob === selectedJob.id}
                            variant="danger"
                            className="flex-1"
                          >
                            {deletingJob === selectedJob.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Deleting...
                              </>
                            ) : (
                              "Yes, Delete Forever"
                            )}
                          </Button>
                          <Button
                            onClick={() => setShowDeleteConfirm(null)}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowDeleteConfirm(selectedJob.id)}
                        variant="outline"
                        className="w-full border-red-300 text-red-700 hover:bg-red-50"
                      >
                        🗑️ Remove from My Data
                      </Button>
                    )}
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
