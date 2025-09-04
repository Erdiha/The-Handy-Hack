// src/lib/stripe.ts
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
  typescript: true,
});

// Payment calculation utilities
export const PaymentUtils = {
  /**
   * Calculate fees for our escrow system
   * Customer pays: jobAmount + 8% service fee
   * Handyman gets: jobAmount - 5% platform fee
   */
  calculateFees(jobAmountDollars: number) {
    // Convert to cents (Stripe uses cents)
    const jobAmount = Math.round(jobAmountDollars * 100);

    // Calculate fees
    const customerFee = Math.round(jobAmount * 0.08); // 8% customer service fee
    const handymanFee = Math.round(jobAmount * 0.05); // 5% handyman platform fee

    // Calculate totals
    const totalCharged = jobAmount + customerFee; // What customer pays
    const handymanPayout = jobAmount - handymanFee; // What handyman receives

    return {
      jobAmount, // Original amount in cents
      customerFee, // 8% fee in cents
      handymanFee, // 5% fee in cents
      totalCharged, // jobAmount + customerFee
      handymanPayout, // jobAmount - handymanFee

      // Helper for display (convert back to dollars)
      display: {
        jobAmount: jobAmountDollars,
        customerFee: customerFee / 100,
        handymanFee: handymanFee / 100,
        totalCharged: totalCharged / 100,
        handymanPayout: handymanPayout / 100,
      },
    };
  },

  /**
   * Create payment intent for escrow
   */
  async createEscrowPayment(params: {
    jobId: string;
    customerId: string;
    handymanId: string;
    jobAmountDollars: number;
    description: string;
  }) {
    const fees = this.calculateFees(params.jobAmountDollars);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: fees.totalCharged, // Total amount customer pays
        currency: "usd",
        customer: params.customerId, // Stripe customer ID
        description: params.description,
        metadata: {
          jobId: params.jobId,
          handymanId: params.handymanId,
          jobAmount: fees.jobAmount.toString(),
          customerFee: fees.customerFee.toString(),
          handymanFee: fees.handymanFee.toString(),
          handymanPayout: fees.handymanPayout.toString(),
        },
        // Enable automatic confirmation
        confirmation_method: "automatic",
      });

      return {
        success: true,
        paymentIntent,
        fees,
      };
    } catch (error) {
      console.error("Stripe payment intent creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment setup failed",
      };
    }
  },

  /**
   * Release payment to handyman (after job completion)
   */
  async releaseEscrowPayment(params: {
    paymentIntentId: string;
    handymanStripeAccountId: string;
    handymanPayoutAmount: number; // in cents
    jobId: string;
  }) {
    try {
      // Create transfer to handyman's Stripe Connect account
      const transfer = await stripe.transfers.create({
        amount: params.handymanPayoutAmount,
        currency: "usd",
        destination: params.handymanStripeAccountId,
        metadata: {
          jobId: params.jobId,
          paymentIntentId: params.paymentIntentId,
        },
      });

      return {
        success: true,
        transfer,
      };
    } catch (error) {
      console.error("Stripe transfer failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transfer failed",
      };
    }
  },

  /**
   * Create or retrieve Stripe customer
   */
  async getOrCreateCustomer(params: {
    email: string;
    name: string;
    userId: string;
  }) {
    try {
      // Try to find existing customer
      const existingCustomers = await stripe.customers.list({
        email: params.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return {
          success: true,
          customer: existingCustomers.data[0],
          isNew: false,
        };
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          userId: params.userId,
        },
      });

      return {
        success: true,
        customer,
        isNew: true,
      };
    } catch (error) {
      console.error("Stripe customer creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Customer setup failed",
      };
    }
  },
};

// Types for TypeScript
export interface EscrowPaymentData {
  jobId: string;
  customerId: string;
  handymanId: string;
  jobAmountDollars: number;
  description: string;
}

export interface PaymentFees {
  jobAmount: number;
  customerFee: number;
  handymanFee: number;
  totalCharged: number;
  handymanPayout: number;
  display: {
    jobAmount: number;
    customerFee: number;
    handymanFee: number;
    totalCharged: number;
    handymanPayout: number;
  };
}
