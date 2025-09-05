// src/app/api/support/check-tickets/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportTickets } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);
    const parsedJobId = parseInt(jobId, 10);

    // Check for active support tickets for this job by this user
    const activeTickets = await db
      .select({
        id: supportTickets.id,
        problemType: supportTickets.problemType,
        status: supportTickets.status,
        createdAt: supportTickets.createdAt,
      })
      .from(supportTickets)
      .where(
        and(
          eq(supportTickets.jobId, parsedJobId),
          eq(supportTickets.reportedBy, userId),
          eq(supportTickets.status, "open") // Only check for open tickets
        )
      )
      .limit(1);

    if (activeTickets.length > 0) {
      const ticket = activeTickets[0];
      return NextResponse.json({
        success: true,
        hasActiveTicket: true,
        ticket: {
          id: ticket.id,
          problemType: ticket.problemType,
          status: ticket.status,
          createdAt: ticket.createdAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveTicket: false,
    });
  } catch (error) {
    console.error("Check tickets error:", error);
    return NextResponse.json(
      { error: "Failed to check support tickets" },
      { status: 500 }
    );
  }
}
