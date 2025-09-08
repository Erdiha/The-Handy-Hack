// src/lib/stripe.ts
import Stripe from "stripe";

// --- Stripe client ---
const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) throw new Error("STRIPE_SECRET_KEY is not set");
export const stripe = new Stripe(KEY); // optionally: { apiVersion: "2024-12-18" }

// --- Fee model ---
// Customer pays: job + 8% service
// Platform keeps: 2% of job
// Handyman gets: 90% of job (released via transfer)
export const FEES = { servicePct: 0.08, platformPct: 0.02 } as const;

const toCents = (usd: number): number => Math.round(usd * 100);
const round = (v: number): number => Math.round(v);
const idem = (prefix: string, id: string | number): string => `${prefix}_${id}`;

// --- Types ---
export type Currency = "usd" | "eur" | "gbp" | (string & {});
export interface PaymentFees {
  jobAmount: number; // cents
  customerFee: number; // cents (8%)
  platformFee: number; // cents (2%)
  handymanPayout: number; // cents (90%)
  totalCharged: number; // cents (job + service)
}
export interface CreateEscrowPaymentParams {
  jobId: string;
  customerStripeId?: string | null; // 'cus_...'
  handymanId: string; // app id, stored as metadata
  jobAmountDollars: number;
  description: string;
  currency?: Currency; // default 'usd'
}
export interface CreateEscrowPaymentResult {
  success: true;
  paymentIntent: Stripe.PaymentIntent;
  clientSecret: string;
  fees: PaymentFees;
}
export interface ReleaseParams {
  jobId: string | number;
  handymanStripeAccountId: string; // 'acct_...'
  payoutCents: number; // 90% of job
  currency?: Currency; // default 'usd'
}
export interface RefundParams {
  jobId: string | number;
  paymentIntentId?: string; // 'pi_...'
  chargeId?: string; // 'ch_...'
  amountCents?: number; // optional partial
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}
export interface Success<T> {
  success: true;
  value: T;
}
export interface Failure {
  success: false;
  error: string;
}
type Result<T> = Success<T> | Failure;

// --- Fee calc ---
export function calculateFees(jobAmountDollars: number): PaymentFees {
  const job = toCents(jobAmountDollars);
  const service = round(job * FEES.servicePct);
  const platform = round(job * FEES.platformPct);
  const payout = job - platform;
  const total = job + service;
  return {
    jobAmount: job,
    customerFee: service,
    platformFee: platform,
    handymanPayout: payout,
    totalCharged: total,
  };
}

// In your src/lib/stripe.ts file, find this function:

export async function createEscrowPayment(
  params: CreateEscrowPaymentParams
): Promise<
  Result<{
    paymentIntent: Stripe.PaymentIntent;
    clientSecret: string;
    fees: PaymentFees;
  }>
> {
  const {
    jobId,
    customerStripeId,
    handymanId,
    jobAmountDollars,
    description,
    currency = "usd",
  } = params;

  const fees = calculateFees(jobAmountDollars);
  const transfer_group = `job_${jobId}`;

  try {
    const pi = await stripe.paymentIntents.create(
      {
        amount: fees.totalCharged, // job + 8%
        currency,
        customer: customerStripeId || undefined, // must be 'cus_...' if provided
        description,
        metadata: {
          jobId,
          handymanId,
          base_job_cents: String(fees.jobAmount),
          customer_fee_cents: String(fees.customerFee),
          platform_fee_cents: String(fees.platformFee),
          payout_cents: String(fees.handymanPayout),
        },
        transfer_group,
        automatic_payment_methods: { enabled: true },
      },
      {
        // FIX: Add timestamp to make key unique for each attempt
        idempotencyKey: `pi_create_${jobId}_${Date.now()}`,
      }
    );

    const clientSecret = pi.client_secret;
    if (!clientSecret) {
      return {
        success: false,
        error: "Missing client_secret on PaymentIntent",
      };
    }

    return { success: true, value: { paymentIntent: pi, clientSecret, fees } };
  } catch (e) {
    if (e instanceof Error) return { success: false, error: e.message };
    return { success: false, error: "Failed to create PaymentIntent" };
  }
}
// --- Release payout (transfer 90% to connected account) ---
export async function releaseEscrowPayment(
  params: ReleaseParams
): Promise<Result<Stripe.Transfer>> {
  const {
    jobId,
    handymanStripeAccountId,
    payoutCents,
    currency = "usd",
  } = params;

  if (!handymanStripeAccountId.startsWith("acct_")) {
    return { success: false, error: "Invalid handyman Stripe account id" };
  }
  if (payoutCents <= 0) {
    return { success: false, error: "Payout must be greater than 0" };
  }

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: payoutCents,
        currency,
        destination: handymanStripeAccountId,
        transfer_group: `job_${jobId}`,
        metadata: { jobId: String(jobId) },
      },
      { idempotencyKey: idem("release", jobId) }
    );
    return { success: true, value: transfer };
  } catch (e) {
    if (e instanceof Error) return { success: false, error: e.message };
    return { success: false, error: "Transfer failed" };
  }
}

// --- Refund (full/partial) ---
export async function refundPayment(
  params: RefundParams
): Promise<Result<Stripe.Refund>> {
  const { jobId, paymentIntentId, chargeId, amountCents, reason } = params;
  if (!paymentIntentId && !chargeId) {
    return { success: false, error: "Provide paymentIntentId or chargeId" };
  }

  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        charge: chargeId,
        amount: amountCents,
        reason,
        metadata: { jobId: String(jobId) },
      },
      { idempotencyKey: idem("refund", `${jobId}_${amountCents ?? "full"}`) }
    );
    return { success: true, value: refund };
  } catch (e) {
    if (e instanceof Error) return { success: false, error: e.message };
    return { success: false, error: "Refund failed" };
  }
}

// --- Customer helper (Stripe Customer 'cus_...') ---
export async function getOrCreateStripeCustomer(
  email: string,
  name?: string,
  appUserId?: string | number
): Promise<Stripe.Customer> {
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) return existing.data[0];

  return stripe.customers.create({
    email,
    name,
    metadata: { appUserId: appUserId ? String(appUserId) : "" },
  });
}
