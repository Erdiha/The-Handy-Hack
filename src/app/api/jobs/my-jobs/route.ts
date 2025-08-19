import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, users } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq, and } from "drizzle-orm";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const handymanId = parseInt(request.user!.id);

    const myJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        category: jobs.category,
        location: jobs.location,
        status: jobs.status,
        budget: jobs.budget,
        budgetAmount: jobs.budgetAmount,
        createdAt: jobs.createdAt,
        acceptedAt: jobs.acceptedAt, // ADD THIS
        completedAt: jobs.completedAt, // ADD THIS
        customerName: users.name,
      })
      .from(jobs)
      .innerJoin(users, eq(jobs.postedBy, users.id))
      .where(eq(jobs.acceptedBy, handymanId))
      .orderBy(jobs.createdAt);

    return NextResponse.json({
      success: true,
      jobs: myJobs,
    });
  } catch (error) {
    console.error("Error fetching my jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
});
