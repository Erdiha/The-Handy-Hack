// src/app/api/payments/refund/route.ts
import { NextRequest, NextResponse } from "next/server";
import { refundPayment } from "@/lib/stripe";

export const runtime = "nodejs";

type Body = {
  jobId: number | string;
  paymentIntentId?: string; // 'pi_...'
  chargeId?: string; // 'ch_...'
  amountCents?: number; // optional partial
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
};

export async function POST(req: NextRequest) {
  const body: unknown = await req.json();
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const { jobId, paymentIntentId, chargeId, amountCents, reason } =
    body as Body;

  if (!jobId || (!paymentIntentId && !chargeId)) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const res = await refundPayment({
    jobId,
    paymentIntentId,
    chargeId,
    amountCents,
    reason,
  });

  if (!res.success) {
    return NextResponse.json(
      { success: false, error: res.error },
      { status: 400 }
    );
  }

  const amount = res.value.amount ?? amountCents ?? null;
  return NextResponse.json({
    success: true,
    message: "Refund processed",
    amount: amount ? amount / 100 : null,
    refundId: res.value.id,
  });
}
