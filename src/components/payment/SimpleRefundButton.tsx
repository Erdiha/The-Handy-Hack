"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface SimpleRefundButtonProps {
  jobId: string;
  paymentAmount: number;
  onRefundUpdate: () => void;
}

export function SimpleRefundButton({
  jobId,
  paymentAmount,
  onRefundUpdate,
}: SimpleRefundButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRefund = async (refundType: "cancellation" | "no_show") => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: parseInt(jobId),
          refundType,
          refundReason:
            refundType === "cancellation"
              ? "Customer cancelled job"
              : "Handyman did not show up",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message} - $${data.amount.toFixed(2)}`);
        onRefundUpdate();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage("❌ Failed to process refund");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleRefund("cancellation")}
        disabled={loading}
        variant="outline"
        size="sm"
        className="border-orange-300 text-orange-600 hover:bg-orange-50"
      >
        {loading ? "Processing..." : "Cancel Job"}
      </Button>
      <Button
        onClick={() => handleRefund("no_show")}
        disabled={loading}
        variant="outline"
        size="sm"
        className="border-red-300 text-red-600 hover:bg-red-50"
      >
        {loading ? "Processing..." : "No Show"}
      </Button>
    </div>
  );
}
