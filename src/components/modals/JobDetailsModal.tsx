"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: number;
    title: string;
    description: string;
    category: string;
    location: string;
    status: string;
    budget: string;
    budgetAmount: string | null;
    acceptedAt: string | null;
    completedAt: string | null;
    customerName: string;
  } | null;
}

export function JobDetailsModal({
  isOpen,
  onClose,
  job,
}: JobDetailsModalProps) {
  if (!job) return null;

  const getBudgetDisplay = () => {
    if (job.budget === "quote") return "Get quotes";
    if (job.budget === "hour") return `$${job.budgetAmount}/hr`;
    return `$${job.budgetAmount} fixed`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Job Details" size="lg">
      <div className="space-y-6">
        {/* Job Header */}
        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            {job.title}
          </h3>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                job.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {job.status}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-600">{job.category}</span>
          </div>
        </div>

        {/* Customer & Payment */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Customer</h4>
            <p className="text-lg text-slate-900">{job.customerName}</p>
            <p className="text-slate-600">{job.location}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Payment</h4>
            <p className="text-2xl font-bold text-slate-900">
              {getBudgetDisplay()}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-2">Description</h4>
          <p className="text-slate-700 leading-relaxed">{job.description}</p>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3">Timeline</h4>
          <div className="space-y-2 text-sm">
            {job.acceptedAt ? (
              <div className="flex justify-between">
                <span className="text-slate-600">Accepted:</span>
                <span className="text-slate-900">
                  {new Date(job.acceptedAt).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-slate-600">Accepted:</span>
                <span className="text-slate-500 italic">Date not recorded</span>
              </div>
            )}

            {job.completedAt ? (
              <div className="flex justify-between">
                <span className="text-slate-600">Completed:</span>
                <span className="text-slate-900">
                  {new Date(job.completedAt).toLocaleDateString()}
                </span>
              </div>
            ) : job.status === "completed" ? (
              <div className="flex justify-between">
                <span className="text-slate-600">Completed:</span>
                <span className="text-slate-500 italic">Date not recorded</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
            Contact Customer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
