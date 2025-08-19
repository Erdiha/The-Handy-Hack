import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, users } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq, desc } from "drizzle-orm";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);

    const customerJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        category: jobs.category,
        location: jobs.location,
        budget: jobs.budget,
        budgetAmount: jobs.budgetAmount,
        status: jobs.status,
        urgency: jobs.urgency,
        createdAt: jobs.createdAt,
        acceptedAt: jobs.acceptedAt,
        completedAt: jobs.completedAt,
        acceptedBy: jobs.acceptedBy,
        handymanName: users.name,
        handymanPhone: users.phone,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.acceptedBy, users.id))
      .where(eq(jobs.postedBy, userId))
      .orderBy(desc(jobs.createdAt));

    const transformedJobs = customerJobs.map((job) => ({
      id: job.id.toString(),
      title: job.title,
      description: job.description,
      category: job.category,
      location: job.location,
      budget: job.budget,
      budgetAmount: job.budgetAmount?.toString(),
      status: job.status,
      urgency: job.urgency,
      createdAt: job.createdAt.toISOString(),
      acceptedAt: job.acceptedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      handyman: job.acceptedBy
        ? {
            id: job.acceptedBy.toString(),
            name: job.handymanName,
            phone: job.handymanPhone,
          }
        : null,
      responses: Math.floor(Math.random() * 8) + 1,
    }));

    return NextResponse.json({
      success: true,
      jobs: transformedJobs,
    });
  } catch (error) {
    console.error("Error fetching customer jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
});
