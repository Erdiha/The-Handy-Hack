// src/app/api/support/report-problem/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportTickets } from "@/lib/schema";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, jobTitle, handymanName, problemType, description } =
      await request.json();

    // Validate input
    if (!jobId || !problemType || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id, 10);

    // Save to database
    const newTicket = await db
      .insert(supportTickets)
      .values({
        jobId: parseInt(jobId),
        reportedBy: userId,
        problemType,
        description: description.trim(),
        status: "open",
        priority: "normal",
        // Store job context for easier access
        jobTitle: jobTitle || null,
        handymanName: handymanName || null,
        customerEmail: session.user.email || null,
      })
      .returning({ id: supportTickets.id });

    const ticketId = newTicket[0].id;

    // Log for debugging
    console.log(
      `[SUPPORT_TICKET_CREATED] Ticket #${ticketId} created by user ${userId} for job ${jobId}`
    );

    // TODO: Send email notification to support team
    // TODO: Auto-assign based on problem type
    // TODO: Send confirmation email to customer

    return NextResponse.json({
      success: true,
      ticketId,
      message: "Problem report submitted successfully",
    });
  } catch (error) {
    console.error("Problem report submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit problem report" },
      { status: 500 }
    );
  }
}
