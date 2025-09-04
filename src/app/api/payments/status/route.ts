// src/app/api/payments/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, jobs, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    // Validate input
    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const parsedJobId = parseInt(jobId, 10);
    const parsedUserId = parseInt(session.user.id, 10);

    if (isNaN(parsedJobId) || isNaN(parsedUserId)) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    // Get job and payment details with user information
    const results = await db
      .select({
        // Job info
        jobId: jobs.id,
        jobTitle: jobs.title,
        jobStatus: jobs.status,
        jobPaymentStatus: jobs.paymentStatus,
        jobPostedBy: jobs.postedBy,
        jobAcceptedBy: jobs.acceptedBy,
        jobBudgetAmount: jobs.budgetAmount,

        // Payment info
        paymentId: payments.id,
        paymentStatus: payments.status,
        stripePaymentIntentId: payments.stripePaymentIntentId,
        stripeTransferId: payments.stripeTransferId,
        jobAmount: payments.jobAmount,
        customerFee: payments.customerFee,
        handymanFee: payments.handymanFee,
        totalCharged: payments.totalCharged,
        handymanPayout: payments.handymanPayout,
        paidAt: payments.paidAt,
        releasedAt: payments.releasedAt,

        // Customer info
        customerName: users.name,
        customerEmail: users.email,
      })
      .from(jobs)
      .leftJoin(payments, eq(payments.jobId, jobs.id))
      .leftJoin(users, eq(users.id, jobs.postedBy))
      .where(eq(jobs.id, parsedJobId))
      .limit(1);

    const result = results[0];
    if (!result) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user has permission to view this payment status
    const isCustomer = result.jobPostedBy === parsedUserId;
    const isHandyman = result.jobAcceptedBy === parsedUserId;

    if (!isCustomer && !isHandyman) {
      return NextResponse.json(
        {
          error: "You do not have permission to view this payment status",
        },
        { status: 403 }
      );
    }

    // Get handyman info if job is accepted
    let handymanInfo = null;
    if (result.jobAcceptedBy) {
      const handymanResults = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          stripeConnectAccountId: users.stripeConnectAccountId,
          stripeOnboardingComplete: users.stripeOnboardingComplete,
        })
        .from(users)
        .where(eq(users.id, result.jobAcceptedBy))
        .limit(1);

      handymanInfo = handymanResults[0] || null;
    }

    // Determine next action for the user
    let nextAction = null;
    let canTakeAction = false;

    if (isCustomer) {
      if (!result.paymentId && result.jobAcceptedBy) {
        nextAction = "create_payment";
        canTakeAction = true;
      } else if (result.paymentStatus === "pending") {
        nextAction = "complete_payment";
        canTakeAction = true;
      } else if (
        result.paymentStatus === "escrowed" &&
        result.jobStatus === "completed"
      ) {
        nextAction = "release_payment";
        canTakeAction = true;
      }
    } else if (isHandyman) {
      if (result.paymentStatus === "escrowed") {
        nextAction = "waiting_for_release";
        canTakeAction = false;
      } else if (!handymanInfo?.stripeOnboardingComplete) {
        nextAction = "complete_stripe_onboarding";
        canTakeAction = true;
      }
    }

    // Format response based on user role
    const response = {
      success: true,
      job: {
        id: result.jobId,
        title: result.jobTitle,
        status: result.jobStatus,
        paymentStatus: result.jobPaymentStatus,
        budgetAmount: result.jobBudgetAmount
          ? parseFloat(result.jobBudgetAmount)
          : null,
        isAccepted: !!result.jobAcceptedBy,
      },
      payment: result.paymentId
        ? {
            id: result.paymentId,
            status: result.paymentStatus,
            amounts: {
              jobAmount: (result.jobAmount || 0) / 100,
              customerFee: (result.customerFee || 0) / 100,
              handymanFee: (result.handymanFee || 0) / 100,
              totalCharged: (result.totalCharged || 0) / 100,
              handymanPayout: (result.handymanPayout || 0) / 100,
            },
            timestamps: {
              paidAt: result.paidAt,
              releasedAt: result.releasedAt,
            },
            stripePaymentIntentId: isCustomer
              ? result.stripePaymentIntentId
              : null, // Only show to customer
            stripeTransferId: result.stripeTransferId,
          }
        : null,
      participants: {
        customer: {
          name: result.customerName,
          email: isCustomer ? result.customerEmail : null, // Only show own email
        },
        handyman: handymanInfo
          ? {
              name: handymanInfo.name,
              email: isHandyman ? handymanInfo.email : null, // Only show own email
              stripeOnboardingComplete: handymanInfo.stripeOnboardingComplete,
            }
          : null,
      },
      userRole: isCustomer ? "customer" : "handyman",
      nextAction,
      canTakeAction,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Payment status error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
