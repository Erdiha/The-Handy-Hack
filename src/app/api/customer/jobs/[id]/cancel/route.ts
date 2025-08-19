// app/api/jobs/[id]/cancel/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq, and } from "drizzle-orm";

export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").slice(-2, -1)[0]; // Extract id from URL path
  const params = { id };
  try {
    const jobId = parseInt(params.id);
    const userId = parseInt(request.user!.id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    // Check if job exists and belongs to user
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.postedBy, userId)))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if job can be cancelled
    if (job.status !== "open") {
      return NextResponse.json(
        { error: "Only open jobs can be cancelled" },
        { status: 400 }
      );
    }

    // Update job status to cancelled
    await db
      .update(jobs)
      .set({ status: "cancelled" })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({
      success: true,
      message: "Job cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling job:", error);
    return NextResponse.json(
      { error: "Failed to cancel job" },
      { status: 500 }
    );
  }
});
