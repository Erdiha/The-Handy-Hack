// src/components/modals/PaymentModal.tsx
"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  CardElement,
  useElements,
  useStripe,
  Elements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  jobAmount: number; // dollars
  handymanId?: string;
  onPaymentSuccess?: () => void;
}

function PaymentForm({
  onClose,
  jobId,
  jobTitle,
  jobAmount,
  handymanId,
  onPaymentSuccess,
}: Omit<PaymentModalProps, "isOpen">) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async () => {
    setError("");
    if (!stripe || !elements) return;

    setLoading(true);

    // Prepare payment data
    const paymentData = {
      jobId,
      jobTitle,
      jobAmountDollars: jobAmount,
      handymanId: handymanId || "1",
      description: `Payment for ${jobTitle}`,
      currency: "usd",
    };

    console.log("🔍 Sending payment data:", paymentData);

    // 1) Create PaymentIntent on server
    const createRes = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    const createJson = await createRes.json();
    if (!createRes.ok || !createJson?.clientSecret) {
      setError(createJson?.error || "Failed to start payment");
      setLoading(false);
      return;
    }

    // 2) Confirm on client
    const card = elements.getElement(CardElement);
    if (!card) {
      setError("Payment form not ready");
      setLoading(false);
      return;
    }

    const { error: confirmErr, paymentIntent } =
      await stripe.confirmCardPayment(createJson.clientSecret, {
        payment_method: { card },
      });

    if (confirmErr) {
      setError(confirmErr.message || "Payment failed");
      setLoading(false);
      return;
    }

    if (!paymentIntent?.id) {
      setError("Missing PaymentIntent id");
      setLoading(false);
      return;
    }
    console.log("🔍 Payment Intent ID:", paymentIntent?.id);
    console.log(
      "🔍 Sending to confirm:",
      JSON.stringify({
        paymentIntentId: paymentIntent.id,
      })
    );
    // 3) Notify server
    const confirmRes = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIntentId: paymentIntent.id,
      }),
    });
    const confirmJson = await confirmRes.json();
    if (!confirmRes.ok) {
      setError(confirmJson?.error || "Failed to record payment");
      setLoading(false);
      return;
    }

    setLoading(false);
    onPaymentSuccess?.();
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded border border-slate-200 bg-white">
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      {error && (
        <div className="text-sm p-2 rounded bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || !stripe || !elements}
        className="w-full bg-orange-500 hover:bg-orange-600"
      >
        {loading ? "Processing…" : `Pay $${jobAmount}`}
      </Button>
    </div>
  );
}

export function PaymentModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  jobAmount,
  handymanId,
  onPaymentSuccess,
}: PaymentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pay $${jobAmount} for ${jobTitle}`}
      size="md"
    >
      <Elements stripe={stripePromise}>
        <PaymentForm
          onClose={onClose}
          jobId={jobId}
          jobTitle={jobTitle}
          jobAmount={jobAmount}
          handymanId={handymanId}
          onPaymentSuccess={onPaymentSuccess}
        />
      </Elements>
    </Modal>
  );
}
