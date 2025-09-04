import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, payments } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq, and } from "drizzle-orm";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const handymanId = parseInt(request.user!.id);

    // Get today's date boundaries
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get completed jobs with RELEASED payments only
    const completedJobs = await db
      .select({
        id: jobs.id,
        budgetAmount: jobs.budgetAmount,
        completedAt: jobs.completedAt,
        budget: jobs.budget,
        handymanPayout: payments.handymanPayout, // Use actual payout, not budget
        releasedAt: payments.releasedAt,
      })
      .from(jobs)
      .innerJoin(payments, eq(payments.jobId, jobs.id))
      .where(
        and(
          eq(jobs.acceptedBy, handymanId),
          eq(jobs.status, "completed"),
          eq(payments.status, "released") // CRITICAL: Only count released payments
        )
      );

    // Calculate earnings using actual payout amounts
    let todayEarnings = 0;
    let weeklyEarnings = 0;
    let jobsToday = 0;
    let jobsThisWeek = 0;

    completedJobs.forEach((job) => {
      // Use handymanPayout (actual amount received) not budgetAmount
      const amount = (job.handymanPayout || 0) / 100; // Convert from cents to dollars
      const releasedDate = job.releasedAt ? new Date(job.releasedAt) : null;

      if (releasedDate) {
        // Today's earnings
        if (releasedDate >= startOfToday) {
          todayEarnings += amount;
          jobsToday++;
        }

        // Weekly earnings
        if (releasedDate >= startOfWeek) {
          weeklyEarnings += amount;
          jobsThisWeek++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      earnings: {
        today: Math.round(todayEarnings),
        week: Math.round(weeklyEarnings),
        jobsToday,
        jobsThisWeek,
        totalCompleted: completedJobs.length,
      },
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
});
