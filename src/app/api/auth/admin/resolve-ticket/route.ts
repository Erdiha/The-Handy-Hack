// src/app/api/admin/resolve-ticket/route.ts - FIXED with proper null handling
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportTickets, payments, jobs, refunds } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== "erdiha@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId, action } = await request.json();

    if (!ticketId || !action || !["refund", "release"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const parsedTicketId = parseInt(ticketId, 10);
    const adminUserId = parseInt(session.user.id, 10);

    if (isNaN(parsedTicketId) || isNaN(adminUserId)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    // Get ticket details
    const ticketResults = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, parsedTicketId))
      .limit(1);

    if (ticketResults.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticketData = ticketResults[0];

    if (ticketData.status !== "open") {
      return NextResponse.json(
        { error: "Ticket is already resolved" },
        { status: 400 }
      );
    }

    // Null check for jobId
    if (!ticketData.jobId) {
      return NextResponse.json(
        { error: "Ticket has no associated job" },
        { status: 400 }
      );
    }

    // Get job and payment details
    const jobPaymentResults = await db
      .select({
        jobId: jobs.id,
        jobTitle: jobs.title,
        paymentId: payments.id,
        totalCharged: payments.totalCharged,
        handymanPayout: payments.handymanPayout,
        paymentStatus: payments.status,
      })
      .from(jobs)
      .innerJoin(payments, eq(payments.jobId, jobs.id))
      .where(eq(jobs.id, ticketData.jobId))
      .limit(1);

    if (jobPaymentResults.length === 0) {
      return NextResponse.json(
        { error: "Job or payment not found" },
        { status: 404 }
      );
    }

    const jobPaymentData = jobPaymentResults[0];
    const { jobTitle, paymentId, totalCharged, handymanPayout, paymentStatus } =
      jobPaymentData;

    // Null checks for required fields
    if (!jobTitle || !paymentId || !totalCharged || !handymanPayout) {
      return NextResponse.json(
        { error: "Missing required payment data" },
        { status: 400 }
      );
    }

    if (paymentStatus !== "escrowed") {
      return NextResponse.json(
        { error: "Payment is not in escrow" },
        { status: 400 }
      );
    }

    // Perform the resolution action
    if (action === "refund") {
      try {
        // Create refund record
        await db.insert(refunds).values({
          paymentId: paymentId,
          requestedBy: ticketData.reportedBy,
          approvedBy: adminUserId,
          refundType: "quality",
          refundReason: `Support ticket #${ticketData.id} resolution: ${ticketData.problemType}`,
          originalAmount: totalCharged,
          requestedAmount: totalCharged,
          approvedAmount: totalCharged,
          status: "completed",
          approvedAt: new Date(),
          processedAt: new Date(),
          completedAt: new Date(),
          stripeRefundId: `admin_refund_${Date.now()}`,
        });

        // Update payment status
        await db
          .update(payments)
          .set({ status: "refunded" })
          .where(eq(payments.id, paymentId));

        // Update job payment status
        await db
          .update(jobs)
          .set({ paymentStatus: "refunded" })
          .where(eq(jobs.id, ticketData.jobId));

        // Resolve the ticket
        await db
          .update(supportTickets)
          .set({
            status: "resolved",
            resolution: `Refund approved: Full refund of $${(
              totalCharged / 100
            ).toFixed(2)} processed for customer.`,
            resolvedBy: adminUserId,
            resolvedAt: new Date(),
          })
          .where(eq(supportTickets.id, parsedTicketId));

        return NextResponse.json({
          success: true,
          message: `Customer refunded $${(totalCharged / 100).toFixed(
            2
          )} for "${jobTitle}"`,
        });
      } catch (refundError) {
        console.error("Refund operation failed:", refundError);
        return NextResponse.json(
          { error: "Failed to process refund" },
          { status: 500 }
        );
      }
    } else if (action === "release") {
      try {
        // Mock Stripe transfer
        const mockTransferId = `admin_release_${Date.now()}`;

        // Update payment status
        await db
          .update(payments)
          .set({
            status: "released",
            releasedAt: new Date(),
            stripeTransferId: mockTransferId,
          })
          .where(eq(payments.id, paymentId));

        // Update job payment status
        await db
          .update(jobs)
          .set({ paymentStatus: "released" })
          .where(eq(jobs.id, ticketData.jobId));

        // Resolve the ticket
        await db
          .update(supportTickets)
          .set({
            status: "resolved",
            resolution: `Payment released: $${(handymanPayout / 100).toFixed(
              2
            )} released to handyman. Customer issue resolved.`,
            resolvedBy: adminUserId,
            resolvedAt: new Date(),
          })
          .where(eq(supportTickets.id, parsedTicketId));

        return NextResponse.json({
          success: true,
          message: `Payment of $${(handymanPayout / 100).toFixed(
            2
          )} released to handyman for "${jobTitle}"`,
        });
      } catch (releaseError) {
        console.error("Release operation failed:", releaseError);
        return NextResponse.json(
          { error: "Failed to release payment" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Ticket resolution error:", error);
    return NextResponse.json(
      { error: "Failed to resolve ticket" },
      { status: 500 }
    );
  }
}
