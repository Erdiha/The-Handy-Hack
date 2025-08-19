// app/api/customer/neighborhood-stats/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, users, handymanProfiles, neighborhoods } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq, and, gte, sql } from "drizzle-orm";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get user's neighborhood
    const [user] = await db
      .select({ neighborhood: neighborhoods.name })
      .from(users)
      .leftJoin(handymanProfiles, eq(users.id, handymanProfiles.userId))
      .leftJoin(
        neighborhoods,
        eq(handymanProfiles.neighborhoodId, neighborhoods.id)
      )
      .where(eq(users.id, userId))
      .limit(1);

    // Jobs this week (all users in area - simplified)
    const [jobsThisWeek] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(gte(jobs.createdAt, oneWeekAgo));
    // Calculate real average response time
    const responseTimeQuery = await db
      .select({
        avgMinutes: sql<number>`avg(extract(epoch from (${jobs.acceptedAt} - ${jobs.createdAt})) / 60)`,
      })
      .from(jobs)
      .where(
        and(
          gte(jobs.createdAt, oneWeekAgo),
          sql`${jobs.acceptedAt} IS NOT NULL`
        )
      );

    const avgMinutes = responseTimeQuery[0]?.avgMinutes || 0;
    let avgResponseTime = "18 min"; // fallback

    if (avgMinutes > 0) {
      if (avgMinutes < 60) {
        avgResponseTime = `${Math.round(avgMinutes)} min`;
      } else {
        const hours = Math.round((avgMinutes / 60) * 10) / 10;
        avgResponseTime = `${hours} hrs`;
      }
    }
    // Available handymen (simplified)
    const [availableHandymen] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "handyman"));

    return NextResponse.json({
      success: true,
      stats: {
        jobsThisWeek: jobsThisWeek.count,
        avgResponseTime, // Mock for now
        availableHandymen: availableHandymen.count,
        neighborhood: user?.neighborhood || "Your area",
      },
    });
  } catch (error) {
    console.error("Error fetching neighborhood stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch neighborhood stats" },
      { status: 500 }
    );
  }
});
