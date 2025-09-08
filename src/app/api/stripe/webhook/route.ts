// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { payments, jobs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("❌ Missing STRIPE_WEBHOOK_SECRET");
    return new NextResponse("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("❌ Missing stripe-signature header");
    return new NextResponse("Missing signature", { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
    console.log("✅ Webhook verified:", event.type, event.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid signature";
    console.error("❌ Webhook signature verification failed:", msg);
    return new NextResponse(`Webhook Error: ${msg}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("🎉 Payment succeeded:", pi.id);

        // Find payment record by Stripe PaymentIntent ID
        const paymentResult = await db
          .select()
          .from(payments)
          .where(eq(payments.stripePaymentIntentId, pi.id))
          .limit(1);

        if (paymentResult.length === 0) {
          console.error("❌ Payment record not found for PI:", pi.id);
          return NextResponse.json(
            { received: true, error: "Payment record not found" },
            { status: 202 }
          );
        }

        const payment = paymentResult[0];
        console.log("✅ Found payment record:", payment.id);

        // Only update if still pending (avoid race condition with manual confirmation)
        if (payment.status === "pending") {
          // Update payment status to escrowed
          await db
            .update(payments)
            .set({
              status: "escrowed",
              paidAt: new Date(),
            })
            .where(eq(payments.id, payment.id));

          // Update job payment status
          await db
            .update(jobs)
            .set({ paymentStatus: "escrowed" })
            .where(eq(jobs.id, payment.jobId));

          console.log(
            "✅ Payment escrowed via webhook for job:",
            payment.jobId
          );
        } else {
          console.log("ℹ️ Payment already processed, status:", payment.status);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(
          "❌ Payment failed:",
          pi.id,
          pi.last_payment_error?.message
        );

        // Find and update payment record
        const paymentResult = await db
          .select()
          .from(payments)
          .where(eq(payments.stripePaymentIntentId, pi.id))
          .limit(1);

        if (paymentResult.length > 0) {
          await db
            .update(payments)
            .set({ status: "failed" })
            .where(eq(payments.id, paymentResult[0].id));

          await db
            .update(jobs)
            .set({ paymentStatus: "failed" })
            .where(eq(jobs.id, paymentResult[0].jobId));

          console.log("✅ Payment marked as failed via webhook");
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log(
          "🔄 Charge refunded:",
          charge.id,
          "Amount:",
          charge.amount_refunded
        );

        if (charge.payment_intent) {
          const paymentResult = await db
            .select()
            .from(payments)
            .where(
              eq(
                payments.stripePaymentIntentId,
                charge.payment_intent as string
              )
            )
            .limit(1);

          if (paymentResult.length > 0) {
            const isFullRefund = charge.amount_refunded === charge.amount;
            const newStatus = isFullRefund ? "refunded" : "partially_refunded";

            await db
              .update(payments)
              .set({
                status: newStatus,
                refundedAt: new Date(),
              })
              .where(eq(payments.id, paymentResult[0].id));

            await db
              .update(jobs)
              .set({ paymentStatus: newStatus })
              .where(eq(jobs.id, paymentResult[0].jobId));

            console.log(
              "✅ Payment refund status updated via webhook:",
              newStatus
            );
          }
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        console.log(
          "⚠️ Dispute created:",
          dispute.id,
          "Charge:",
          dispute.charge
        );

        if (dispute.payment_intent) {
          const paymentResult = await db
            .select()
            .from(payments)
            .where(
              eq(
                payments.stripePaymentIntentId,
                dispute.payment_intent as string
              )
            )
            .limit(1);

          if (paymentResult.length > 0) {
            await db
              .update(payments)
              .set({ status: "disputed" })
              .where(eq(payments.id, paymentResult[0].id));

            await db
              .update(jobs)
              .set({ paymentStatus: "disputed" })
              .where(eq(jobs.id, paymentResult[0].jobId));

            console.log("✅ Payment marked as disputed via webhook");
          }
        }
        break;
      }

      default:
        console.log("ℹ️ Unhandled webhook event:", event.type);
        break;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unhandled webhook error";
    console.error("❌ Webhook processing error:", msg, "Event:", event.type);
    return NextResponse.json({ received: true, error: msg }, { status: 202 });
  }

  return NextResponse.json({ received: true, event_type: event.type });
}
