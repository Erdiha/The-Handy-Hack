import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, handymanProfiles, users, neighborhoods } from "@/lib/schema";
import { eq, desc, avg, count, gte, and, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const neighborhood = searchParams.get("neighborhood");

    // Calculate date 7 days ago for "this week" stats
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Build the where condition for handymen
    let handymenConditions = and(
      eq(users.role, "handyman"),
      eq(handymanProfiles.isAvailable, true)
    );

    // Add neighborhood filter if specified
    if (neighborhood && neighborhood !== "All Areas") {
      handymenConditions = and(
        eq(users.role, "handyman"),
        eq(handymanProfiles.isAvailable, true),
        eq(neighborhoods.name, neighborhood)
      );
    }

    // Get handymen in selected neighborhood (or all if "All Areas")
    const handymenData = await db
      .select({
        id: users.id,
        hourlyRate: handymanProfiles.hourlyRate,
      })
      .from(users)
      .innerJoin(handymanProfiles, eq(users.id, handymanProfiles.userId))
      .leftJoin(
        neighborhoods,
        eq(handymanProfiles.neighborhoodId, neighborhoods.id)
      )
      .where(handymenConditions);

    const handymanIds = handymenData.map((h) => h.id);
    const hourlyRates = handymenData
      .map((h) => parseFloat(h.hourlyRate || "0"))
      .filter((rate) => rate > 0);

    // 1. Jobs completed this week by handymen in this neighborhood
    let jobsCompletedCount = 0;
    if (handymanIds.length > 0) {
      const jobsThisWeek = await db
        .select({ count: count() })
        .from(jobs)
        .where(
          and(
            eq(jobs.status, "completed"),
            gte(jobs.completedAt, oneWeekAgo),
            inArray(jobs.acceptedBy, handymanIds)
          )
        );

      jobsCompletedCount = jobsThisWeek[0]?.count || 0;
    }

    // 2. Calculate average hourly rate
    const averageHourlyRate =
      hourlyRates.length > 0
        ? Math.round(
            hourlyRates.reduce((sum, rate) => sum + rate, 0) /
              hourlyRates.length
          )
        : 65;

    // 3. Active handymen count
    const activeHandymenCount = handymenData.length;

    const stats = {
      jobsCompletedThisWeek: jobsCompletedCount,
      averageHourlyRate,
      activeHandymenCount,
      responseTime: "18 minutes",
      savingsVsTaskRabbit: "$25/job",
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching community stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch community stats" },
      { status: 500 }
    );
  }
}
