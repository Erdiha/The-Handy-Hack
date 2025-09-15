// components/modals/CustomerJobDetailsModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
interface CustomerJob {
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
  handyman?: {
    id: string;
    name: string;
    phone?: string;
  };
  responses?: number;
}
interface CustomerJobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: CustomerJob | null;
  onJobUpdate: () => void;
}

export function CustomerJobDetailsModal({
  isOpen,
  onClose,
  job,
  onJobUpdate,
}: CustomerJobDetailsModalProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !job) return null;

  const handleCancelJob = async () => {
    if (!confirm("Are you sure you want to cancel this job?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/cancel`, {
        method: "PATCH",
      });

      if (response.ok) {
        alert("Job cancelled successfully");
        onJobUpdate();
        onClose();
      }
    } catch (error) {
      alert("Failed to cancel job");
    } finally {
      setActionLoading(false);
    }
  };

  //handles delete
  const handleDeleteJob = async () => {
    if (!job) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Job deleted successfully");
        onJobUpdate();
        onClose();
      }
    } catch (error) {
      alert("Failed to delete job");
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleArchiveJob = async () => {
    if (!job) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/archive`, {
        method: "PATCH",
      });

      if (response.ok) {
        alert("Job archived successfully");
        onJobUpdate();
        onClose();
      }
    } catch (error) {
      alert("Failed to archive job");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Job Details</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {job.title}
            </h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                job.status
              )}`}
            >
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>

          <div>
            <h4 className="font-medium text-slate-700 mb-2">Description</h4>
            <p className="text-slate-600 leading-relaxed">{job.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-slate-700 mb-1">Category</h4>
              <p className="text-slate-600">{job.category}</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-700 mb-1">Location</h4>
              <p className="text-slate-600">{job.location}</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-700 mb-1">Budget</h4>
              <p className="text-slate-600">
                {job.budget === "hour"
                  ? `$${job.budgetAmount}/hr`
                  : `$${job.budgetAmount} fixed`}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-700 mb-1">Urgency</h4>
              <p className="text-slate-600">{job.urgency}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-slate-700 mb-1">Posted</h4>
            <p className="text-slate-600">
              {new Date(job.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {job.handyman && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">
                Assigned Handyman
              </h4>
              <div className="space-y-2">
                <p className="text-green-700">
                  <strong>Name:</strong> {job.handyman.name}
                </p>
                {job.handyman.phone && (
                  <p className="text-green-700">
                    <strong>Phone:</strong> {job.handyman.phone}
                  </p>
                )}
                {job.acceptedAt && (
                  <p className="text-green-700 text-sm">
                    Accepted on {new Date(job.acceptedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {!job.handyman && job.status === "open" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700">
                <strong>Status:</strong> Waiting for handymen to respond
              </p>
              <p className="text-blue-600 text-sm mt-1">
                You&apos;ll be notified when someone accepts your job
              </p>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-200">
          {/* Delete confirmation warning */}
          {showDeleteConfirm && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                Are you sure? This will permanently delete the job.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-300 text-slate-700"
            >
              Close
            </Button>

            {job.status === "open" && (
              <>
                <Button
                  onClick={
                    showDeleteConfirm
                      ? handleDeleteJob
                      : () => setShowDeleteConfirm(true)
                  }
                  disabled={actionLoading}
                  variant="secondary"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600"
                >
                  {actionLoading
                    ? "Deleting..."
                    : showDeleteConfirm
                    ? "Confirm Delete"
                    : "Delete Job"}
                </Button>
                <Button
                  onClick={
                    showDeleteConfirm
                      ? () => setShowDeleteConfirm(false)
                      : handleArchiveJob
                  }
                  disabled={actionLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {actionLoading
                    ? "Archiving..."
                    : showDeleteConfirm
                    ? "Cancel"
                    : "Archive Job"}
                </Button>
              </>
            )}

            {(job.status === "accepted" || job.status === "completed") && (
              <Button
                onClick={handleArchiveJob}
                disabled={actionLoading}
                variant="outline"
                className="flex-1"
              >
                {actionLoading ? "Archiving..." : "Archive Job"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
