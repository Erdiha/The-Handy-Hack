// app/api/customer/trusted-handymen/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, users, handymanProfiles } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq, and, sql, desc } from "drizzle-orm";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);

    // Get handymen who have completed jobs for this customer
    const trustedHandymen = await db
      .select({
        handymanId: jobs.acceptedBy,
        handymanName: users.name,
        handymanPhone: users.phone,
        jobCount: sql<number>`count(*)`,
        lastJobDate: sql<Date>`max(${jobs.completedAt})`,
        primaryCategory: sql<string>`mode() within group (order by ${jobs.category})`,
        totalSpent: sql<number>`sum(cast(${jobs.budgetAmount} as decimal))`,
        hourlyRate: handymanProfiles.hourlyRate,
      })
      .from(jobs)
      .innerJoin(users, eq(jobs.acceptedBy, users.id))
      .leftJoin(handymanProfiles, eq(jobs.acceptedBy, handymanProfiles.userId))
      .where(and(eq(jobs.postedBy, userId), eq(jobs.status, "completed")))
      .groupBy(
        jobs.acceptedBy,
        users.name,
        users.phone,
        handymanProfiles.hourlyRate
      )
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const transformedHandymen = trustedHandymen.map((handyman) => ({
      id: handyman.handymanId?.toString(),
      name: handyman.handymanName,
      phone: handyman.handymanPhone,
      jobCount: handyman.jobCount,
      lastJobDate: handyman.lastJobDate?.toISOString(),
      service: handyman.primaryCategory,
      totalSpent: Math.round(handyman.totalSpent || 0),
      hourlyRate: handyman.hourlyRate,
      rating: 4.5 + Math.random() * 0.4, // Mock rating
      available: true, // Mock availability
    }));

    return NextResponse.json({
      success: true,
      trustedHandymen: transformedHandymen,
    });
  } catch (error) {
    console.error("Error fetching trusted handymen:", error);
    return NextResponse.json(
      { error: "Failed to fetch trusted handymen" },
      { status: 500 }
    );
  }
});
