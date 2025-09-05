// src/components/payment/PaymentButton.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { SimpleRefundButton } from "./SimpleRefundButton";
import { ReportProblemModal } from "@/components/modals/ReportProblemModal";

interface ActiveTicket {
  id: number;
  problemType: string;
  status: string;
  createdAt: string;
}

interface PaymentButtonProps {
  jobId: string;
  jobTitle: string;
  jobAmount: number;
  currentUserId: string;
  jobPosterId: string;
  jobAcceptedBy?: string;
  jobStatus: string;
  paymentStatus?: string;
  onPaymentUpdate: () => void;
}

interface PaymentStatusData {
  success: boolean;
  job: {
    id: number;
    title: string;
    status: string;
    paymentStatus: string;
    isAccepted: boolean;
  };
  payment: {
    id: number;
    status: string;
    amounts: {
      handymanPayout: number;
      totalCharged: number;
    };
  } | null;
  userRole: "customer" | "handyman";
  nextAction: string | null;
  canTakeAction: boolean;
  participants: {
    handyman: {
      name: string;
    } | null;
  };
}

export function PaymentButton({
  jobId,
  jobTitle,
  jobAmount,
  currentUserId,
  jobPosterId,
  jobAcceptedBy,
  jobStatus,
  paymentStatus = "unpaid",
  onPaymentUpdate,
}: PaymentButtonProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReportProblemModalOpen, setIsReportProblemModalOpen] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentStatusData | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [activeTicket, setActiveTicket] = useState<ActiveTicket | null>(null);

  const isCustomer = currentUserId === jobPosterId;

  // Fetch detailed payment status
  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments/status?jobId=${jobId}`);
      const data = await response.json();
      if (data.success) {
        setPaymentData(data);
      }
    } catch (error) {
      console.error("Failed to fetch payment status:", error);
    }
  };

  // Check for active support tickets
  const checkActiveTickets = async () => {
    try {
      const response = await fetch(`/api/support/check-tickets?jobId=${jobId}`);
      const data = await response.json();
      if (data.success && data.hasActiveTicket) {
        setActiveTicket(data.ticket);
      } else {
        setActiveTicket(null);
      }
    } catch (error) {
      console.error("Failed to check active tickets:", error);
    }
  };

  useEffect(() => {
    if (jobAcceptedBy) {
      fetchPaymentStatus();
      checkActiveTickets();
    }
  }, [jobId, jobAcceptedBy]);

  const handleReleasePayment = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/payments/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: parseInt(jobId) }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        onPaymentUpdate();
        fetchPaymentStatus();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage("❌ Failed to release payment");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    onPaymentUpdate();
    fetchPaymentStatus();
    setIsPaymentModalOpen(false);
  };

  // Don't show payment button if user is not the customer
  if (!isCustomer) {
    return null;
  }

  // Job not accepted yet
  if (!jobAcceptedBy) {
    return (
      <div className="text-sm text-slate-500 italic">
        Payment available once job is accepted
      </div>
    );
  }

  // Show message if there's a status update
  if (message) {
    return (
      <div className="space-y-2">
        <div
          className={`text-sm p-2 rounded ${
            message.includes("✅")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
        <Button
          onClick={() => setMessage("")}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Close
        </Button>
      </div>
    );
  }

  // Use detailed payment data if available, otherwise fall back to props
  const currentPaymentStatus = paymentData?.payment?.status || paymentStatus;
  const currentJobStatus = paymentData?.job?.status || jobStatus;
  const handymanName = paymentData?.participants?.handyman?.name || "handyman";
  const payoutAmount =
    paymentData?.payment?.amounts?.handymanPayout || jobAmount * 0.95;

  // Payment status: unpaid -> pending -> escrowed -> released
  switch (currentPaymentStatus) {
    case "unpaid":
      return (
        <>
          <Button
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
            disabled={loading}
          >
            Pay ${jobAmount} (Secure Escrow)
          </Button>
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            jobId={jobId}
            jobTitle={jobTitle}
            jobAmount={jobAmount}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </>
      );

    case "pending":
      return (
        <div className="space-y-2">
          <Button disabled className="bg-yellow-500 text-white cursor-wait">
            ⏳ Payment Processing...
          </Button>
          <div className="text-xs text-slate-500">
            Complete your payment to secure the handyman
          </div>
        </div>
      );

    case "escrowed":
      // Show different options based on job completion status
      if (currentJobStatus === "completed") {
        // Check if there's an active support ticket
        if (activeTicket) {
          return (
            <div className="space-y-3">
              {/* Issue reported message */}
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="text-sm font-medium text-yellow-800 mb-1">
                  🚧 Issue reported (#{activeTicket.id}) - payment on hold
                </div>
                <div className="text-sm text-yellow-700">
                  Support will contact you within 24 hours
                </div>
              </div>

              {/* Status info */}
              <div className="text-center text-xs text-slate-500">
                Report status: {activeTicket.status} • Problem:{" "}
                {activeTicket.problemType}
              </div>
            </div>
          );
        }

        // Normal completed job flow (no active tickets)
        return (
          <div className="space-y-3">
            {/* Auto-release message */}
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="text-sm font-medium text-green-800 mb-1">
                ✅ {handymanName} completed your job
              </div>
              <div className="text-sm text-green-700">
                Payment releases automatically in 24 hours
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleReleasePayment}
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                {loading ? "Releasing..." : "Release Now"}
              </Button>
              <Button
                onClick={() => setIsReportProblemModalOpen(true)}
                variant="outline"
                className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                Report Problem
              </Button>
            </div>

            {/* Report Problem Modal */}
            <ReportProblemModal
              isOpen={isReportProblemModalOpen}
              onClose={() => {
                setIsReportProblemModalOpen(false);
                // Refresh ticket status after reporting
                checkActiveTickets();
              }}
              jobId={jobId}
              jobTitle={jobTitle}
              handymanName={handymanName}
            />
          </div>
        );
      } else {
        return (
          <div className="space-y-2">
            <Button disabled className="bg-blue-500 text-white cursor-default">
              💰 Payment Secured (${jobAmount})
            </Button>
            <div className="text-xs text-slate-600">
              Payment is held in escrow. Will be released when {handymanName}{" "}
              completes the job.
            </div>
          </div>
        );
      }

    case "released":
      return (
        <div className="space-y-2">
          <Button disabled className="bg-gray-500 text-white cursor-default">
            ✅ Payment Released
          </Button>
          <div className="text-xs text-slate-600">
            ${payoutAmount.toFixed(2)} paid to {handymanName}
          </div>
        </div>
      );

    default:
      return (
        <div className="text-sm text-slate-500">
          Payment status: {currentPaymentStatus}
        </div>
      );
  }
}
