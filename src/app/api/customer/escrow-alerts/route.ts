// src/app/api/customer/escrow-alerts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, jobs, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedUserId = parseInt(session.user.id, 10);
    if (isNaN(parsedUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Get all escrowed payments for this customer
    const escrowedPayments = await db
      .select({
        // Payment info
        paymentId: payments.id,
        totalCharged: payments.totalCharged,
        handymanPayout: payments.handymanPayout,
        paidAt: payments.paidAt,

        // Job info
        jobId: jobs.id,
        jobTitle: jobs.title,
        jobStatus: jobs.status,
        jobLocation: jobs.location,
        acceptedAt: jobs.acceptedAt,
        completedAt: jobs.completedAt,

        // Handyman info
        handymanName: users.name,
        handymanId: users.id,
      })
      .from(payments)
      .innerJoin(jobs, eq(payments.jobId, jobs.id))
      .leftJoin(users, eq(users.id, jobs.acceptedBy))
      .where(
        and(
          eq(payments.customerId, parsedUserId),
          eq(payments.status, "escrowed")
        )
      )
      .orderBy(jobs.completedAt); // Show completed jobs first

    // Calculate totals
    const totalEscrowed = escrowedPayments.reduce(
      (sum, payment) => sum + (payment.totalCharged || 0),
      0
    );

    const totalHandymanPayout = escrowedPayments.reduce(
      (sum, payment) => sum + (payment.handymanPayout || 0),
      0
    );

    // Categorize payments
    const readyToRelease = escrowedPayments.filter(
      (payment) => payment.jobStatus === "completed"
    );

    const workInProgress = escrowedPayments.filter(
      (payment) => payment.jobStatus === "accepted"
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalEscrowed: totalEscrowed / 100, // Convert to dollars
        totalHandymanPayout: totalHandymanPayout / 100,
        totalJobs: escrowedPayments.length,
        readyToReleaseCount: readyToRelease.length,
        workInProgressCount: workInProgress.length,
      },
      readyToRelease: readyToRelease.map((payment) => ({
        jobId: payment.jobId,
        jobTitle: payment.jobTitle,
        jobLocation: payment.jobLocation,
        handymanName: payment.handymanName,
        handymanPayout: (payment.handymanPayout || 0) / 100,
        completedAt: payment.completedAt,
        daysSinceCompleted: payment.completedAt
          ? Math.floor(
              (Date.now() - new Date(payment.completedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      })),
      workInProgress: workInProgress.map((payment) => ({
        jobId: payment.jobId,
        jobTitle: payment.jobTitle,
        jobLocation: payment.jobLocation,
        handymanName: payment.handymanName,
        handymanPayout: (payment.handymanPayout || 0) / 100,
        acceptedAt: payment.acceptedAt,
        daysSinceAccepted: payment.acceptedAt
          ? Math.floor(
              (Date.now() - new Date(payment.acceptedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      })),
    });
  } catch (error) {
    console.error("Escrow alerts error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
