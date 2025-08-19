import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq, and, gte, sql } from "drizzle-orm";

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
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of this week
    startOfWeek.setHours(0, 0, 0, 0);

    // Get completed jobs by this handyman
    const completedJobs = await db
      .select({
        id: jobs.id,
        budgetAmount: jobs.budgetAmount,
        completedAt: jobs.completedAt,
        budget: jobs.budget,
      })
      .from(jobs)
      .where(
        and(eq(jobs.acceptedBy, handymanId), eq(jobs.status, "completed"))
      );

    // Calculate earnings
    let todayEarnings = 0;
    let weeklyEarnings = 0;
    let jobsToday = 0;
    let jobsThisWeek = 0;

    completedJobs.forEach((job) => {
      const amount = parseFloat(job.budgetAmount || "0");
      const completedDate = job.completedAt ? new Date(job.completedAt) : null;

      if (completedDate) {
        // Today's earnings
        if (completedDate >= startOfToday) {
          todayEarnings += amount;
          jobsToday++;
        }

        // Weekly earnings
        if (completedDate >= startOfWeek) {
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
