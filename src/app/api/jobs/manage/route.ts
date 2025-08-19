// app/api/jobs/manage/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, users } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq, and, or, isNull } from "drizzle-orm";

interface JobUpdateData {
  status?: string;
  archivedAt?: string | null;
}

// PATCH - Update job status (archive, restore, etc.)
export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { jobId, action }: { jobId: string; action: string } = body;

    if (!jobId || !action) {
      return NextResponse.json(
        { error: "Job ID and action are required" },
        { status: 400 }
      );
    }

    const userId = parseInt(request.user!.id);
    const jobIdInt = parseInt(jobId);

    // Verify the job exists and belongs to the current user (handyman)
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobIdInt), eq(jobs.acceptedBy, userId)))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or unauthorized" },
        { status: 404 }
      );
    }

    let updateData = {};
    let successMessage = "";

    switch (action) {
      case "archive":
        if (job.status !== "completed") {
          return NextResponse.json(
            { error: "Only completed jobs can be archived" },
            { status: 400 }
          );
        }
        updateData = {
          status: "archived",
          archivedAt: new Date(), // CORRECT - just the Date object
        };
        successMessage = "Job archived successfully";
        break;

      case "restore":
        if (job.status !== "archived") {
          return NextResponse.json(
            { error: "Only archived jobs can be restored" },
            { status: 400 }
          );
        }
        updateData = {
          status: "completed",
          archivedAt: null,
          hiddenFromHandyman: false, // ADD THIS LINE - also unhide when restoring
        };
        successMessage = "Job restored successfully";
        break;
      case "delete":
        if (job.status !== "archived") {
          return NextResponse.json(
            { error: "Only archived jobs can be removed" },
            { status: 400 }
          );
        }

        // CHANGE from actual delete to hiding:
        updateData = {
          hiddenFromHandyman: true,
        };
        successMessage = "Job removed from your data";

        await db.update(jobs).set(updateData).where(eq(jobs.id, jobIdInt));

        return NextResponse.json({
          success: true,
          message: successMessage,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update the job for archive/restore actions
    await db.update(jobs).set(updateData).where(eq(jobs.id, jobIdInt));

    return NextResponse.json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    console.error("Job management error:", error);
    return NextResponse.json(
      { error: "Failed to manage job" },
      { status: 500 }
    );
  }
});

// GET - Fetch jobs by status for a handyman
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = parseInt(request.user!.id);

    // Build query conditions
    const conditions = [
      eq(jobs.acceptedBy, userId),
      or(eq(jobs.hiddenFromHandyman, false), isNull(jobs.hiddenFromHandyman)),
    ];
    if (status) {
      conditions.push(eq(jobs.status, status));
    }

    // Get jobs with customer names
    const jobResults = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        category: jobs.category,
        location: jobs.location,
        budget: jobs.budget,
        budgetAmount: jobs.budgetAmount,
        status: jobs.status,
        createdAt: jobs.createdAt,
        acceptedAt: jobs.acceptedAt,
        completedAt: jobs.completedAt,
        archivedAt: jobs.archivedAt,
        postedBy: jobs.postedBy,
        customerName: users.name,
      })
      .from(jobs)
      .innerJoin(users, eq(jobs.postedBy, users.id))
      .where(and(...conditions))
      .orderBy(jobs.createdAt);

    const formattedJobs = jobResults.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      category: job.category,
      location: job.location,
      budget: job.budget,
      budgetAmount: job.budgetAmount?.toString() || null,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      acceptedAt: job.acceptedAt?.toISOString() || null,
      completedAt: job.completedAt?.toISOString() || null,
      archivedAt: job.archivedAt
        ? new Date(job.archivedAt).toISOString()
        : null,
      customerName: job.customerName,
      postedBy: job.postedBy,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
});
