// src/app/api/payments/refund/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, jobs, refunds } from "@/lib/schema";
import { eq } from "drizzle-orm";

type RefundType = "cancellation" | "no_show" | "partial" | "quality";

interface RefundRequest {
  jobId: number;
  refundType: RefundType;
  refundReason: string;
  requestedAmount?: number;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, refundType, refundReason, requestedAmount }: RefundRequest =
      await request.json();

    if (!jobId || !refundType || !refundReason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    // Get job and payment with inner join to ensure both exist
    const result = await db
      .select({
        jobPostedBy: jobs.postedBy,
        jobStatus: jobs.status,
        paymentId: payments.id,
        paymentStatus: payments.status,
        totalCharged: payments.totalCharged,
      })
      .from(jobs)
      .innerJoin(payments, eq(payments.jobId, jobs.id))
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Job or payment not found" },
        { status: 404 }
      );
    }

    const jobData = result[0];

    // Verify user owns the job
    if (jobData.jobPostedBy !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify payment can be refunded
    if (!["escrowed", "released"].includes(jobData.paymentStatus)) {
      return NextResponse.json(
        { error: "Payment cannot be refunded" },
        { status: 400 }
      );
    }

    // Check for existing refund
    const existingRefund = await db
      .select({ id: refunds.id })
      .from(refunds)
      .where(eq(refunds.paymentId, jobData.paymentId))
      .limit(1);

    if (existingRefund.length > 0) {
      return NextResponse.json(
        { error: "Refund already exists" },
        { status: 400 }
      );
    }

    // Calculate refund
    let amount: number;
    let autoApprove: boolean;

    switch (refundType) {
      case "cancellation":
        if (!["open", "accepted"].includes(jobData.jobStatus)) {
          return NextResponse.json(
            { error: "Cannot cancel completed job" },
            { status: 400 }
          );
        }
        amount = jobData.totalCharged;
        autoApprove = true;
        break;
      case "no_show":
        amount = jobData.totalCharged;
        autoApprove = true;
        break;
      case "partial":
      case "quality":
        if (!requestedAmount || requestedAmount <= 0) {
          return NextResponse.json(
            { error: "Amount required" },
            { status: 400 }
          );
        }
        amount = Math.round(requestedAmount * 100);
        if (amount > jobData.totalCharged) {
          return NextResponse.json(
            { error: "Amount too high" },
            { status: 400 }
          );
        }
        autoApprove = false;
        break;
    }

    // Create refund
    const newRefund = await db
      .insert(refunds)
      .values({
        paymentId: jobData.paymentId,
        requestedBy: userId,
        refundType,
        refundReason,
        originalAmount: jobData.totalCharged,
        requestedAmount: amount,
        status: autoApprove ? "approved" : "pending",
        approvedAmount: autoApprove ? amount : null,
        approvedBy: autoApprove ? userId : null,
        approvedAt: autoApprove ? new Date() : null,
      })
      .returning({ id: refunds.id });

    // Update payment status
    await db
      .update(payments)
      .set({ status: autoApprove ? "refunding" : "disputed" })
      .where(eq(payments.id, jobData.paymentId));

    // If auto-approved, complete the mock refund process immediately
    if (autoApprove) {
      // Mock Stripe refund (in real app: await stripe.refunds.create())
      const mockStripeRefundId = `re_mock_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Complete the refund
      await db
        .update(refunds)
        .set({
          status: "completed",
          stripeRefundId: mockStripeRefundId,
          processedAt: new Date(),
          completedAt: new Date(),
        })
        .where(eq(refunds.id, newRefund[0].id));

      // Update payment to final refunded status
      await db
        .update(payments)
        .set({ status: "refunded" })
        .where(eq(payments.id, jobData.paymentId));
    }

    return NextResponse.json({
      success: true,
      refundId: newRefund[0].id,
      amount: amount / 100,
      status: autoApprove ? "approved" : "pending",
      message: autoApprove ? "Refund approved" : "Refund submitted for review",
    });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
