"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StripeClient } from "@/lib/stripe-client";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  jobAmount: number;
  onPaymentSuccess: () => void;
}

interface PaymentFees {
  jobAmount: string;
  customerFee: string;
  totalCharged: string;
  handymanPayout: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  jobAmount,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentStep, setPaymentStep] = useState<
    "confirm" | "processing" | "success"
  >("confirm");
  const [fees, setFees] = useState<PaymentFees | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Calculate and display fees
  const displayFees = StripeClient.calculateDisplayFees(jobAmount);

  const createPayment = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (data.success) {
        setFees(data.fees);
        setClientSecret(data.clientSecret);
        setPaymentStep("processing");
      } else {
        setError(data.error || "Failed to create payment");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!clientSecret) return;

    setLoading(true);
    setError("");

    try {
      // For demo purposes, we'll simulate successful payment
      // In real implementation, you'd use Stripe Elements here

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Confirm payment with backend
      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: clientSecret.split("_secret_")[0],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentStep("success");
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.error || "Payment failed");
      }
    } catch (err) {
      setError("Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset state
      setPaymentStep("confirm");
      setError("");
      setFees(null);
      setClientSecret(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        paymentStep === "success" ? "Payment Successful!" : "Secure Payment"
      }
      size="md"
    >
      <div className="space-y-6">
        {/* Job Details */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 mb-2">Job Details</h3>
          <p className="text-slate-600">{jobTitle}</p>
          <p className="text-lg font-bold text-slate-800 mt-2">
            Job Amount: {displayFees.jobAmount}
          </p>
        </div>

        {/* Payment Steps */}
        {paymentStep === "confirm" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Fee Breakdown */}
            <div className="border border-slate-200 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-3">
                Payment Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Job Amount:</span>
                  <span className="font-medium">{displayFees.jobAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Service Fee (8%):</span>
                  <span className="font-medium">{displayFees.customerFee}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-800">
                      Total Charge:
                    </span>
                    <span className="font-bold text-lg text-slate-800">
                      {displayFees.totalCharged}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Escrow Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 mt-1">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h5 className="font-semibold text-blue-800">
                    Secure Escrow Payment
                  </h5>
                  <p className="text-blue-700 text-sm mt-1">
                    Your payment will be held securely until the job is
                    completed. The handyman will receive{" "}
                    {displayFees.handymanPayout} after you approve the work.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

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
                onClick={createPayment}
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {loading ? "Setting up..." : "Proceed to Payment"}
              </Button>
            </div>
          </motion.div>
        )}

        {paymentStep === "processing" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h4 className="font-semibold text-slate-800 mb-2">
                Processing Payment
              </h4>
              <p className="text-slate-600">
                Total: {fees?.totalCharged || displayFees.totalCharged}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

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
                onClick={processPayment}
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {loading ? "Processing..." : "Complete Payment"}
              </Button>
            </div>
          </motion.div>
        )}

        {paymentStep === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
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
              Payment Successful!
            </h4>
            <p className="text-slate-600 mb-4">
              Your payment of {fees?.totalCharged || displayFees.totalCharged}{" "}
              has been secured in escrow.
            </p>
            <p className="text-sm text-slate-500">
              The handyman can now begin work. You&apos;ll release payment when
              the job is complete.
            </p>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
