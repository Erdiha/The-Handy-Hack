// src/app/api/payments/refund/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { refunds, payments, jobs, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status") || "all";

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Build where conditions
    const conditions = [eq(refunds.requestedBy, userId)];

    if (jobId) {
      const parsedJobId = parseInt(jobId, 10);
      if (!isNaN(parsedJobId)) {
        conditions.push(eq(jobs.id, parsedJobId));
      }
    }

    if (status !== "all") {
      conditions.push(eq(refunds.status, status));
    }

    // Get refund requests - using inner joins to avoid nulls
    const refundRequests = await db
      .select({
        refundId: refunds.id,
        refundType: refunds.refundType,
        refundReason: refunds.refundReason,
        requestedAmount: refunds.requestedAmount,
        approvedAmount: refunds.approvedAmount,
        originalAmount: refunds.originalAmount,
        status: refunds.status,
        stripeRefundId: refunds.stripeRefundId,
        requestedAt: refunds.requestedAt,
        approvedAt: refunds.approvedAt,
        processedAt: refunds.processedAt,
        completedAt: refunds.completedAt,
        jobId: jobs.id,
        jobTitle: jobs.title,
        jobStatus: jobs.status,
        paymentId: payments.id,
        paymentStatus: payments.status,
        approverName: users.name,
      })
      .from(refunds)
      .innerJoin(payments, eq(refunds.paymentId, payments.id))
      .innerJoin(jobs, eq(payments.jobId, jobs.id))
      .leftJoin(users, eq(users.id, refunds.approvedBy))
      .where(and(...conditions))
      .orderBy(refunds.requestedAt);

    // Format response with proper null handling
    const formattedRefunds = refundRequests.map((refund) => ({
      id: refund.refundId,
      job: {
        id: refund.jobId,
        title: refund.jobTitle,
        status: refund.jobStatus,
      },
      refund: {
        type: refund.refundType,
        reason: refund.refundReason,
        status: refund.status,
        amounts: {
          original: refund.originalAmount / 100,
          requested: refund.requestedAmount / 100,
          approved: refund.approvedAmount ? refund.approvedAmount / 100 : null,
        },
        stripeRefundId: refund.stripeRefundId || null,
      },
      timestamps: {
        requested: refund.requestedAt,
        approved: refund.approvedAt || null,
        processed: refund.processedAt || null,
        completed: refund.completedAt || null,
      },
      approver: refund.approverName || null,
      payment: {
        id: refund.paymentId,
        status: refund.paymentStatus,
      },
    }));

    // Calculate summary
    const summary = {
      total: formattedRefunds.length,
      pending: formattedRefunds.filter((r) => r.refund.status === "pending")
        .length,
      approved: formattedRefunds.filter((r) => r.refund.status === "approved")
        .length,
      completed: formattedRefunds.filter((r) => r.refund.status === "completed")
        .length,
      rejected: formattedRefunds.filter((r) => r.refund.status === "rejected")
        .length,
      totalRefunded: formattedRefunds
        .filter((r) => r.refund.status === "completed")
        .reduce((sum, r) => sum + (r.refund.amounts.approved || 0), 0),
    };

    return NextResponse.json({
      success: true,
      refunds: formattedRefunds,
      summary,
    });
  } catch (error) {
    console.error("Refund status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
