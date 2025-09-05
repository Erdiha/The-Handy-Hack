// src/app/api/admin/ticket-details/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportTickets, jobs, users, payments } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== "erdiha@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID required" },
        { status: 400 }
      );
    }

    const parsedTicketId = parseInt(ticketId, 10);
    if (isNaN(parsedTicketId)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    // Get comprehensive ticket details with all related information
    const ticketResults = await db
      .select({
        // Ticket info
        ticketId: supportTickets.id,
        jobId: supportTickets.jobId,
        problemType: supportTickets.problemType,
        description: supportTickets.description,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        resolvedAt: supportTickets.resolvedAt,
        resolution: supportTickets.resolution,

        // Job info
        jobTitle: jobs.title,
        jobDescription: jobs.description,
        jobLocation: jobs.location,
        jobBudget: jobs.budget,
        jobBudgetAmount: jobs.budgetAmount,
        jobCreatedAt: jobs.createdAt,
        jobCompletedAt: jobs.completedAt,
        jobPostedBy: jobs.postedBy,
        jobAcceptedBy: jobs.acceptedBy,
      })
      .from(supportTickets)
      .leftJoin(jobs, eq(supportTickets.jobId, jobs.id))
      .where(eq(supportTickets.id, parsedTicketId))
      .limit(1);

    if (ticketResults.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticketData = ticketResults[0];

    // Null checks for required fields
    if (!ticketData.jobId) {
      return NextResponse.json(
        { error: "Ticket has no associated job" },
        { status: 400 }
      );
    }

    if (!ticketData.jobPostedBy || !ticketData.jobAcceptedBy) {
      return NextResponse.json(
        { error: "Job missing customer or handyman" },
        { status: 400 }
      );
    }

    // Get customer details
    const customerResults = await db
      .select({
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, ticketData.jobPostedBy))
      .limit(1);

    // Get handyman details
    const handymanResults = await db
      .select({
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, ticketData.jobAcceptedBy))
      .limit(1);

    // Get payment details
    const paymentResults = await db
      .select({
        totalCharged: payments.totalCharged,
        handymanPayout: payments.handymanPayout,
        status: payments.status,
      })
      .from(payments)
      .where(eq(payments.jobId, ticketData.jobId))
      .limit(1);

    if (customerResults.length === 0 || handymanResults.length === 0) {
      return NextResponse.json(
        { error: "User data not found" },
        { status: 404 }
      );
    }

    const customerData = customerResults[0];
    const handymanData = handymanResults[0];
    const paymentData = paymentResults[0]; // Could be null if no payment

    // Format the comprehensive ticket details
    const ticketDetails = {
      id: ticketData.ticketId,
      jobId: ticketData.jobId,

      // Job details
      jobTitle: ticketData.jobTitle || "N/A",
      jobDescription: ticketData.jobDescription || "N/A",
      jobLocation: ticketData.jobLocation || "N/A",
      jobBudget: ticketData.jobBudgetAmount
        ? `$${parseFloat(ticketData.jobBudgetAmount).toFixed(2)}`
        : ticketData.jobBudget || "N/A",
      jobCreatedAt: ticketData.jobCreatedAt?.toISOString() || "",
      jobCompletedAt: ticketData.jobCompletedAt?.toISOString() || "",

      // Ticket details
      problemType: ticketData.problemType,
      description: ticketData.description,
      status: ticketData.status,
      priority: ticketData.priority,
      createdAt: ticketData.createdAt.toISOString(),
      resolvedAt: ticketData.resolvedAt?.toISOString() || null,
      resolution: ticketData.resolution || null,

      // Customer details
      customerName: customerData.name || "N/A",
      customerEmail: customerData.email || "N/A",
      customerPhone: customerData.phone || null,

      // Handyman details
      handymanName: handymanData.name || "N/A",
      handymanEmail: handymanData.email || "N/A",
      handymanPhone: handymanData.phone || null,

      // Payment details
      paymentAmount: paymentData?.totalCharged || 0,
      paymentStatus: paymentData?.status || "N/A",
      handymanPayout: paymentData?.handymanPayout || 0,
    };

    return NextResponse.json({
      success: true,
      ticket: ticketDetails,
    });
  } catch (error) {
    console.error("Ticket details fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket details" },
      { status: 500 }
    );
  }
}
