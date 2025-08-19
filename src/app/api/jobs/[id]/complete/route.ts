import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobId = parseInt(params.id);
    const handymanId = parseInt(session.user.id);

    // Check if job exists and is accepted by this handyman
    const [job] = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.acceptedBy, handymanId),
          eq(jobs.status, "accepted")
        )
      )
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not accepted by you" },
        { status: 404 }
      );
    }
    await db
      .update(jobs)
      .set({
        status: "completed",
        completedAt: new Date(), // ADD THIS
      })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({
      success: true,
      message: "Job completed successfully",
    });
  } catch (error) {
    console.error("Error completing job:", error);
    return NextResponse.json(
      { error: "Failed to complete job" },
      { status: 500 }
    );
  }
}
