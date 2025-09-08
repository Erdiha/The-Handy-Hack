// src/app/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, jobs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID required" },
        { status: 400 }
      );
    }

    const userId = Number.parseInt(session.user.id, 10);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Source of truth: confirm PI is succeeded on Stripe
    const pi: Stripe.PaymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );
    if (pi.status !== "succeeded") {
      return NextResponse.json(
        { error: `PaymentIntent not succeeded (${pi.status})` },
        { status: 400 }
      );
    }

    // Find our local payment row by PI id
    const rows = await db
      .select({
        id: payments.id,
        jobId: payments.jobId,
        customerId: payments.customerId,
        status: payments.status,
        totalCharged: payments.totalCharged,
      })
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, pi.id))
      .limit(1);

    const payment = rows[0];
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Only the customer who paid can confirm
    if (payment.customerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Idempotent: if already processed, return current state
    if (payment.status !== "pending") {
      return NextResponse.json({
        success: true,
        message: `Already ${payment.status}`,
        paymentStatus: payment.status,
        amount: payment.totalCharged / 100,
        jobId: payment.jobId,
      });
    }

    // Mark escrowed (DB)
    await db
      .update(payments)
      .set({ status: "escrowed", paidAt: new Date() })
      .where(eq(payments.id, payment.id));

    await db
      .update(jobs)
      .set({ paymentStatus: "escrowed" })
      .where(eq(jobs.id, payment.jobId));

    return NextResponse.json({
      success: true,
      message: "Payment confirmed and escrowed",
      paymentStatus: "escrowed",
      amount: payment.totalCharged / 100,
      jobId: payment.jobId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: msg },
      { status: 500 }
    );
  }
}
