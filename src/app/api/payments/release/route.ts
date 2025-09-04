// src/app/api/payments/release/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, jobs, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await request.json();

    // Validate input
    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const parsedJobId = parseInt(jobId, 10);
    const parsedUserId = parseInt(session.user.id, 10);

    if (isNaN(parsedJobId) || isNaN(parsedUserId)) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    // Get job and payment details with handyman info
    const results = await db
      .select({
        // Job info
        jobId: jobs.id,
        jobStatus: jobs.status,
        jobPostedBy: jobs.postedBy,
        jobAcceptedBy: jobs.acceptedBy,
        jobTitle: jobs.title,

        // Payment info
        paymentId: payments.id,
        paymentStatus: payments.status,
        handymanPayout: payments.handymanPayout,
        stripePaymentIntentId: payments.stripePaymentIntentId,

        // Handyman info
        handymanName: users.name,
        handymanEmail: users.email,
        handymanStripeAccountId: users.stripeConnectAccountId,
      })
      .from(jobs)
      .leftJoin(payments, eq(payments.jobId, jobs.id))
      .leftJoin(users, eq(users.id, jobs.acceptedBy))
      .where(eq(jobs.id, parsedJobId))
      .limit(1);

    const result = results[0];
    if (!result) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify user is the customer who posted the job
    if (result.jobPostedBy !== parsedUserId) {
      return NextResponse.json(
        { error: "Only the job poster can release payment" },
        { status: 403 }
      );
    }

    // Verify job is completed
    if (result.jobStatus !== "completed") {
      return NextResponse.json(
        {
          error: "Job must be completed before releasing payment",
          currentStatus: result.jobStatus,
        },
        { status: 400 }
      );
    }

    // Verify payment exists and is escrowed
    if (!result.paymentId) {
      return NextResponse.json(
        { error: "No payment found for this job" },
        { status: 404 }
      );
    }

    if (result.paymentStatus !== "escrowed") {
      return NextResponse.json(
        {
          error: `Payment cannot be released. Current status: ${result.paymentStatus}`,
          currentStatus: result.paymentStatus,
        },
        { status: 400 }
      );
    }

    // Verify handyman exists
    if (!result.jobAcceptedBy) {
      return NextResponse.json(
        { error: "No handyman assigned to this job" },
        { status: 400 }
      );
    }

    // MOCK STRIPE TRANSFER
    // In real implementation:
    // const transfer = await stripe.transfers.create({
    //   amount: result.handymanPayout,
    //   currency: "usd",
    //   destination: result.handymanStripeAccountId
    // });

    const mockStripeTransfer = {
      success: true,
      id: `tr_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: result.handymanPayout,
      destination: result.handymanStripeAccountId || "acct_mock_handyman",
    };

    if (!mockStripeTransfer.success) {
      return NextResponse.json(
        { error: "Payment transfer to handyman failed" },
        { status: 500 }
      );
    }

    // Start database transaction-like operations
    try {
      // Update payment status to 'released'
      await db
        .update(payments)
        .set({
          status: "released",
          releasedAt: new Date(),
          stripeTransferId: mockStripeTransfer.id,
        })
        .where(eq(payments.id, result.paymentId));

      // Update job payment status
      await db
        .update(jobs)
        .set({
          paymentStatus: "released",
        })
        .where(eq(jobs.id, parsedJobId));

      return NextResponse.json({
        success: true,
        message: `Payment of $${((result.handymanPayout || 0) / 100).toFixed(
          2
        )} released to ${result.handymanName}`,
        transferId: mockStripeTransfer.id,
        handymanPayout: (result.handymanPayout || 0) / 100, // Convert to dollars
        handymanName: result.handymanName,
        jobTitle: result.jobTitle,
      });
    } catch (dbError) {
      console.error("Database update failed during payment release:", dbError);

      // In real implementation, you'd want to reverse the Stripe transfer here
      return NextResponse.json(
        {
          error: "Payment was transferred but database update failed",
          details: dbError instanceof Error ? dbError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Payment release error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
