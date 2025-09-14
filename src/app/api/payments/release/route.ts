// src/app/api/payments/release/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, jobs, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { releaseEscrowPayment } from "@/lib/stripe";

export const runtime = "nodejs";

// 🎛️ TOGGLE THIS TO SWITCH BETWEEN MOCK AND REAL STRIPE
const USE_REAL_STRIPE = false; // Set to true for real Stripe Connect payments

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const parsedJobId = parseInt(jobId, 10);
    if (isNaN(parsedJobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    // Get payment and job details
    const paymentResults = await db
      .select({
        paymentId: payments.id,
        paymentStatus: payments.status,
        handymanPayout: payments.handymanPayout,
        stripeTransferId: payments.stripeTransferId,
        customerId: payments.customerId,
        handymanId: payments.handymanId,
        jobStatus: jobs.status,
      })
      .from(payments)
      .innerJoin(jobs, eq(payments.jobId, jobs.id))
      .where(eq(payments.jobId, parsedJobId))
      .limit(1);

    if (paymentResults.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = paymentResults[0];

    // Verify user is the customer who paid
    if (payment.customerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check payment status
    if (
      payment.paymentStatus !== "escrowed" &&
      payment.paymentStatus !== "pending"
    ) {
      return NextResponse.json(
        {
          error: `Cannot release payment with status: ${payment.paymentStatus}`,
        },
        { status: 400 }
      );
    }

    // Check if already released
    if (payment.stripeTransferId) {
      return NextResponse.json({
        success: true,
        message: "Payment already released",
        transferId: payment.stripeTransferId,
      });
    }

    // Get handyman info
    const handymanResults = await db
      .select({
        stripeConnectAccountId: users.stripeConnectAccountId,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, payment.handymanId))
      .limit(1);

    if (handymanResults.length === 0) {
      return NextResponse.json(
        { error: "Handyman not found" },
        { status: 404 }
      );
    }

    const handyman = handymanResults[0];

    let transferId: string;
    let message: string;

    if (USE_REAL_STRIPE) {
      // 🔴 REAL STRIPE CONNECT MODE
      if (!handyman.stripeConnectAccountId) {
        return NextResponse.json(
          {
            error: "Handyman has not completed Stripe onboarding",
          },
          { status: 400 }
        );
      }

      // Real Stripe transfer
      const releaseResult = await releaseEscrowPayment({
        jobId: parsedJobId,
        handymanStripeAccountId: handyman.stripeConnectAccountId,
        payoutCents: payment.handymanPayout,
        currency: "usd",
      });

      if (!releaseResult.success) {
        return NextResponse.json(
          {
            error: releaseResult.error,
          },
          { status: 400 }
        );
      }

      transferId = releaseResult.value.id;
      message = `Payment released to ${handyman.name}`;
      console.log("✅ REAL Stripe payment released:", transferId);
    } else {
      // 🟡 MOCK MODE (for testing)
      transferId = `test_transfer_${Date.now()}`;
      message = `Payment released to ${handyman.name} (TEST MODE)`;
      console.log("✅ MOCK payment released:", transferId);
    }

    // Update database
    await db
      .update(payments)
      .set({
        status: "released",
        releasedAt: new Date(),
        stripeTransferId: transferId,
      })
      .where(eq(payments.id, payment.paymentId));

    await db
      .update(jobs)
      .set({ paymentStatus: "released" })
      .where(eq(jobs.id, parsedJobId));

    return NextResponse.json({
      success: true,
      message,
      transferId,
      mode: USE_REAL_STRIPE ? "REAL" : "MOCK",
    });
  } catch (error) {
    console.error("❌ Release payment error:", error);
    return NextResponse.json(
      { error: "Failed to release payment" },
      { status: 500 }
    );
  }
}
