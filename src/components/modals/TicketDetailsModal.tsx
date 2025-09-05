// src/components/modals/TicketDetailsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface TicketDetails {
  id: number;
  jobId: number;
  jobTitle: string;
  jobDescription: string;
  jobLocation: string;
  jobBudget: string;
  jobCreatedAt: string;
  jobCompletedAt: string;

  // Ticket info
  problemType: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;

  // Customer details
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;

  // Handyman details
  handymanName: string;
  handymanEmail: string;
  handymanPhone: string | null;

  // Payment info
  paymentAmount: number;
  paymentStatus: string;
  handymanPayout: number;
}

interface TicketDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
  onResolve?: (ticketId: number, action: "refund" | "release") => void;
}

export function TicketDetailsModal({
  isOpen,
  onClose,
  ticketId,
  onResolve,
}: TicketDetailsModalProps) {
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicketDetails();
    }
  }, [isOpen, ticketId]);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/ticket-details?ticketId=${ticketId}`
      );
      const data = await response.json();

      if (data.success) {
        setTicketDetails(data.ticket);
      } else {
        setError(data.error || "Failed to load ticket details");
      }
    } catch (err) {
      setError("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ticket #${ticketId} Details`}
      size="xl"
    >
      <div className="space-y-6  overflow-y-auto max-h-[85vh]">
        {loading && (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-slate-500">Loading ticket details...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {ticketDetails && (
          <div className="space-y-6">
            {/* Ticket Overview */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Ticket Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 text-sm">Ticket ID:</span>
                  <p className="font-medium">#{ticketDetails.id}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-sm">Problem Type:</span>
                  <p className="font-medium">{ticketDetails.problemType}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-sm">Status:</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      ticketDetails.status === "resolved"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {ticketDetails.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-sm">Priority:</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      ticketDetails.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : ticketDetails.priority === "normal"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticketDetails.priority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-sm">Reported:</span>
                  <p className="font-medium">
                    {formatDate(ticketDetails.createdAt)}
                  </p>
                </div>
                {ticketDetails.resolvedAt && (
                  <div>
                    <span className="text-slate-500 text-sm">Resolved:</span>
                    <p className="font-medium">
                      {formatDate(ticketDetails.resolvedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Problem Description */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Problem Description
              </h3>
              <p className="text-slate-700 bg-slate-50 rounded-lg p-4 whitespace-pre-wrap">
                {ticketDetails.description}
              </p>
            </div>

            {/* Job Details */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Job Information
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-slate-500 text-sm">Job Title:</span>
                  <p className="font-medium">{ticketDetails.jobTitle}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-sm">Description:</span>
                  <p className="text-slate-700">
                    {ticketDetails.jobDescription}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 text-sm">Location:</span>
                    <p className="font-medium">{ticketDetails.jobLocation}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-sm">Budget:</span>
                    <p className="font-medium">{ticketDetails.jobBudget}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-sm">Job Created:</span>
                    <p className="font-medium">
                      {formatDate(ticketDetails.jobCreatedAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-sm">
                      Job Completed:
                    </span>
                    <p className="font-medium">
                      {formatDate(ticketDetails.jobCompletedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Parties Involved */}
            <div className="grid grid-cols-2 gap-6">
              {/* Customer Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Customer
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-blue-600 text-sm">Name:</span>
                    <p className="font-medium text-blue-900">
                      {ticketDetails.customerName}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-600 text-sm">Email:</span>
                    <p className="font-medium text-blue-900">
                      {ticketDetails.customerEmail}
                    </p>
                  </div>
                  {ticketDetails.customerPhone && (
                    <div>
                      <span className="text-blue-600 text-sm">Phone:</span>
                      <p className="font-medium text-blue-900">
                        {ticketDetails.customerPhone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Handyman Details */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  Handyman
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-green-600 text-sm">Name:</span>
                    <p className="font-medium text-green-900">
                      {ticketDetails.handymanName}
                    </p>
                  </div>
                  <div>
                    <span className="text-green-600 text-sm">Email:</span>
                    <p className="font-medium text-green-900">
                      {ticketDetails.handymanEmail}
                    </p>
                  </div>
                  {ticketDetails.handymanPhone && (
                    <div>
                      <span className="text-green-600 text-sm">Phone:</span>
                      <p className="font-medium text-green-900">
                        {ticketDetails.handymanPhone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">
                Payment Details
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-orange-600 text-sm">
                    Total Charged:
                  </span>
                  <p className="font-bold text-lg text-orange-900">
                    {formatCurrency(ticketDetails.paymentAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-orange-600 text-sm">
                    Handyman Payout:
                  </span>
                  <p className="font-bold text-lg text-orange-900">
                    {formatCurrency(ticketDetails.handymanPayout)}
                  </p>
                </div>
                <div>
                  <span className="text-orange-600 text-sm">
                    Payment Status:
                  </span>
                  <p className="font-medium text-orange-900">
                    {ticketDetails.paymentStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* Resolution */}
            {ticketDetails.resolution && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  Resolution
                </h3>
                <p className="text-green-800 bg-green-100 rounded-lg p-4">
                  {ticketDetails.resolution}
                </p>
              </div>
            )}

            {/* Action Buttons for Open Tickets */}
            {ticketDetails.status === "open" && onResolve && (
              <div className="flex space-x-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={() => onResolve(ticketDetails.id, "refund")}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Refund Customer
                </Button>
                <Button
                  onClick={() => onResolve(ticketDetails.id, "release")}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  Release Payment
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
