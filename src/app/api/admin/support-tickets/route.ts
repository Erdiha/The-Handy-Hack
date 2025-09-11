// src/app/api/admin/support-tickets/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportTickets, jobs, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== "erdiha@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all support tickets with job and user details
    const tickets = await db
      .select({
        id: supportTickets.id,
        jobId: supportTickets.jobId,
        jobTitle: supportTickets.jobTitle,
        customerEmail: supportTickets.customerEmail,
        handymanName: supportTickets.handymanName,
        problemType: supportTickets.problemType,
        description: supportTickets.description,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        reportedBy: supportTickets.reportedBy,
        resolvedAt: supportTickets.resolvedAt,
        resolution: supportTickets.resolution,
      })
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt));

    return NextResponse.json({
      success: true,
      tickets: tickets.map((ticket) => ({
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        resolvedAt: ticket.resolvedAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Admin support tickets fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, problemType, description } = await request.json();

    if (!problemType || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert ticket
    await db.insert(supportTickets).values({
      jobId: jobId || null,
      jobTitle: jobId ? `Job #${jobId}` : "General Issue",
      customerEmail: session.user.email!,
      handymanName: "",
      problemType,
      description,
      status: "open",
      priority: "normal",
      reportedBy: Number(session.user.id),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "Ticket submitted" });
  } catch (error) {
    console.error("Support ticket create error:", error);
    return NextResponse.json(
      { error: "Failed to submit ticket" },
      { status: 500 }
    );
  }
}
