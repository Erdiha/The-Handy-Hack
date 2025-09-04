// src/app/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, jobs } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentIntentId } = await request.json();

    // Validate input
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID required" },
        { status: 400 }
      );
    }

    const parsedUserId = parseInt(session.user.id, 10);
    if (isNaN(parsedUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Find payment record by Stripe payment intent ID
    const paymentResults = await db
      .select({
        id: payments.id,
        jobId: payments.jobId,
        customerId: payments.customerId,
        handymanId: payments.handymanId,
        status: payments.status,
        totalCharged: payments.totalCharged,
        handymanPayout: payments.handymanPayout,
      })
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntentId))
      .limit(1);

    const paymentRecord = paymentResults[0];
    if (!paymentRecord) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify user is the customer who made the payment
    if (paymentRecord.customerId !== parsedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if payment is already processed
    if (paymentRecord.status !== "pending") {
      return NextResponse.json(
        {
          error: `Payment already ${paymentRecord.status}`,
          currentStatus: paymentRecord.status,
        },
        { status: 400 }
      );
    }

    // MOCK STRIPE CONFIRMATION
    // In real implementation: const result = await stripe.paymentIntents.confirm(paymentIntentId);
    // For now, we'll simulate a successful payment
    const mockStripeConfirmation = {
      success: true,
      status: "succeeded",
      id: paymentIntentId,
    };

    if (!mockStripeConfirmation.success) {
      return NextResponse.json(
        { error: "Payment confirmation failed with Stripe" },
        { status: 400 }
      );
    }

    // Start transaction-like operations
    try {
      // Update payment status to 'escrowed' (money is held until job completion)
      await db
        .update(payments)
        .set({
          status: "escrowed",
          paidAt: new Date(),
        })
        .where(eq(payments.id, paymentRecord.id));

      // Update job payment status
      await db
        .update(jobs)
        .set({
          paymentStatus: "escrowed",
        })
        .where(eq(jobs.id, paymentRecord.jobId));

      return NextResponse.json({
        success: true,
        message: "Payment confirmed and escrowed successfully",
        paymentStatus: "escrowed",
        amount: paymentRecord.totalCharged / 100, // Convert cents to dollars
        jobId: paymentRecord.jobId,
      });
    } catch (dbError) {
      console.error("Database update failed:", dbError);

      // In a real app, you'd want to handle partial failures more carefully
      // For now, return an error
      return NextResponse.json(
        {
          error: "Payment was processed but database update failed",
          details: dbError instanceof Error ? dbError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
