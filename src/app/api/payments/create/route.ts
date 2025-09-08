// src/app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments } from "@/lib/schema";
import { createEscrowPayment } from "@/lib/stripe";

export const runtime = "nodejs";

type Body = {
  jobId: string;
  jobTitle: string; // kept for metadata in your DB (not sent to Stripe here)
  jobAmountDollars: number;
  handymanId: string; // your app id (stored as metadata)
  customerStripeId?: string; // 'cus_...' optional
  description: string;
  currency?: "usd";
};

export async function POST(req: NextRequest) {
  const body: unknown = await req.json();
  if (typeof body !== "object" || body === null)
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );

  const {
    jobId,
    jobTitle,
    jobAmountDollars,
    handymanId,
    customerStripeId,
    description,
    currency,
  } = body as Body;

  if (
    !jobId ||
    !jobTitle ||
    !handymanId ||
    typeof jobAmountDollars !== "number"
  ) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await createEscrowPayment({
    jobId,
    customerStripeId,
    handymanId,
    jobAmountDollars,
    description,
    currency: currency ?? "usd",
  });

  if (!res.success) {
    return NextResponse.json(
      { success: false, error: res.error },
      { status: 500 }
    );
  }

  // Create database record
  try {
    await db.insert(payments).values({
      jobId: parseInt(jobId),
      customerId: parseInt(session.user.id),
      handymanId: parseInt(handymanId),
      stripePaymentIntentId: res.value.paymentIntent.id,
      jobAmount: res.value.fees.jobAmount,
      customerFee: res.value.fees.customerFee,
      handymanFee: res.value.fees.platformFee,
      totalCharged: res.value.fees.totalCharged,
      handymanPayout: res.value.fees.handymanPayout,
      status: "pending",
    });

    console.log("✅ Payment record created:", res.value.paymentIntent.id);
  } catch (dbError) {
    console.error("❌ Database error:", dbError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    clientSecret: res.value.clientSecret,
    fees: res.value.fees,
  });
}
