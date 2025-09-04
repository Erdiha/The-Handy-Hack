import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, jobs } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const POST = async (request: Request) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await request.json();
    const parsedJobId = parseInt(jobId, 10);
    const parsedUserId = parseInt(session.user.id, 10);

    if (isNaN(parsedJobId) || isNaN(parsedUserId)) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    // Get job details
    const job = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        budgetAmount: jobs.budgetAmount,
        postedBy: jobs.postedBy,
        acceptedBy: jobs.acceptedBy,
        status: jobs.status,
      })
      .from(jobs)
      .where(eq(jobs.id, parsedJobId))
      .limit(1);

    if (!job[0]) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const jobData = job[0];

    // Verify user is the customer who posted the job
    if (jobData.postedBy !== parsedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify job is accepted
    if (!jobData.acceptedBy) {
      return NextResponse.json(
        { error: "Job not accepted yet" },
        { status: 400 }
      );
    }

    // CHECK EXISTING PAYMENT FIRST - FIXED ORDER
    const existingPayment = await db
      .select({
        id: payments.id,
        status: payments.status,
        stripePaymentIntentId: payments.stripePaymentIntentId,
      })
      .from(payments)
      .where(eq(payments.jobId, parsedJobId))
      .limit(1);

    // Calculate amounts (in cents)
    const jobAmount = Math.round(parseFloat(jobData.budgetAmount || "0") * 100);
    const customerFee = Math.round(jobAmount * 0.08); // 8% customer fee
    const handymanFee = Math.round(jobAmount * 0.05); // 5% handyman fee
    const totalCharged = jobAmount + customerFee;
    const handymanPayout = jobAmount - handymanFee;

    // Handle existing payment
    if (existingPayment[0]) {
      if (existingPayment[0].status === "pending") {
        const fees = {
          jobAmount: `$${(jobAmount / 100).toFixed(2)}`,
          customerFee: `$${(customerFee / 100).toFixed(2)}`,
          totalCharged: `$${(totalCharged / 100).toFixed(2)}`,
          handymanPayout: `$${(handymanPayout / 100).toFixed(2)}`,
        };

        return NextResponse.json({
          success: true,
          fees,
          clientSecret: `${existingPayment[0].stripePaymentIntentId}_secret_retry`,
          message: "Using existing payment intent",
        });
      } else {
        return NextResponse.json(
          { error: "Payment already completed" },
          { status: 400 }
        );
      }
    }

    // Create mock payment intent
    const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create payment record - ONLY IF NO EXISTING PAYMENT
    await db.insert(payments).values({
      jobId: parsedJobId,
      customerId: parsedUserId,
      handymanId: jobData.acceptedBy,
      jobAmount,
      customerFee,
      handymanFee,
      totalCharged,
      handymanPayout,
      status: "pending",
      stripePaymentIntentId: mockClientSecret.split("_secret_")[0],
    });

    // Update job payment status
    await db
      .update(jobs)
      .set({ paymentStatus: "pending" })
      .where(eq(jobs.id, parsedJobId));

    const fees = {
      jobAmount: `$${(jobAmount / 100).toFixed(2)}`,
      customerFee: `$${(customerFee / 100).toFixed(2)}`,
      totalCharged: `$${(totalCharged / 100).toFixed(2)}`,
      handymanPayout: `$${(handymanPayout / 100).toFixed(2)}`,
    };

    return NextResponse.json({
      success: true,
      fees,
      clientSecret: mockClientSecret,
      message: "Payment intent created successfully",
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
};
