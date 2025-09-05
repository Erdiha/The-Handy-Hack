"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  handymanName: string;
}

export function ReportProblemModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  handymanName,
}: ReportProblemModalProps) {
  const [problemType, setProblemType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const problemTypes = [
    "Work quality issues",
    "Work not completed",
    "Property damage",
    "Handyman didn't show up",
    "Different work than agreed",
    "Other issue",
  ];

  const handleSubmit = async () => {
    if (!problemType || !description.trim()) return;

    setLoading(true);

    // Simple contact form submission
    try {
      const response = await fetch("/api/support/report-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          jobTitle,
          handymanName,
          problemType,
          description: description.trim(),
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to submit problem report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset form after closing
      setTimeout(() => {
        setProblemType("");
        setDescription("");
        setSubmitted(false);
      }, 300);
    }
  };

  if (submitted) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Report Submitted"
        size="md"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h4 className="font-bold text-xl text-slate-800 mb-2">
            Report Submitted Successfully
          </h4>
          <p className="text-slate-600">
            Our support team will review your report and contact you within 24
            hours.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report a Problem"
      size="md"
    >
      <div className="space-y-6">
        {/* Job Info */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 mb-1">Job Details</h3>
          <p className="text-slate-600">{jobTitle}</p>
          <p className="text-sm text-slate-500">Handyman: {handymanName}</p>
        </div>

        {/* Problem Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            What&apos;s the problem?
          </label>
          <div className="space-y-2">
            {problemTypes.map((type) => (
              <button
                key={type}
                onClick={() => setProblemType(type)}
                className={`w-full text-left p-3 border rounded-lg transition-colors ${
                  problemType === type
                    ? "border-orange-300 bg-orange-50 text-orange-800"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Please describe what happened
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us more about the issue so we can help resolve it..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            maxLength={500}
          />
          <p className="text-xs text-slate-500 mt-1">
            {description.length}/500 characters
          </p>
        </div>

        {/* Support Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h6 className="font-semibold text-blue-800 mb-2">
            What happens next?
          </h6>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Our support team reviews your report</li>
            <li>• We&apos;ll contact you within 24 hours</li>
            <li>• We work with both parties to resolve the issue</li>
            <li>• Your payment stays protected until resolved</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !problemType || !description.trim()}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
