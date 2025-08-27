import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// PATCH - Archive job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const jobId = parseInt(id);

    // Check if job exists and user owns it
    const existingJob = await db
      .select()
      .from(jobs)
      .where(
        and(eq(jobs.id, jobId), eq(jobs.postedBy, parseInt(session.user.id)))
      )
      .limit(1);

    if (!existingJob[0]) {
      return NextResponse.json(
        { error: "Job not found or unauthorized" },
        { status: 404 }
      );
    }

    // Archive the job
    await db
      .update(jobs)
      .set({
        status: "archived",
        archivedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({
      success: true,
      message: "Job archived successfully",
    });
  } catch (error) {
    console.error("Archive job error:", error);
    return NextResponse.json(
      { error: "Failed to archive job" },
      { status: 500 }
    );
  }
}
