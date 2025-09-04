// src/lib/stripe-client.ts
import { loadStripe } from "@stripe/stripe-js";

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
}

// Client-side Stripe instance (singleton)
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

// Helper functions for client-side payment processing
export const StripeClient = {
  /**
   * Format amount for display
   */
  formatAmount(amountInCents: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amountInCents / 100);
  },

  /**
   * Calculate and display fee breakdown
   */
  calculateDisplayFees(jobAmountDollars: number) {
    const jobAmount = Math.round(jobAmountDollars * 100);
    const customerFee = Math.round(jobAmount * 0.08);
    const handymanFee = Math.round(jobAmount * 0.05);
    const totalCharged = jobAmount + customerFee;
    const handymanPayout = jobAmount - handymanFee;

    return {
      jobAmount: this.formatAmount(jobAmount),
      customerFee: this.formatAmount(customerFee),
      totalCharged: this.formatAmount(totalCharged),
      handymanPayout: this.formatAmount(handymanPayout),
      handymanFee: this.formatAmount(handymanFee),
    };
  },

  /**
   * Confirm payment on client side
   */
  async confirmPayment(clientSecret: string, paymentMethodId?: string) {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe not loaded");

      const result = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        ...(paymentMethodId && { paymentMethod: paymentMethodId }),
      });

      return result;
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      return {
        error: {
          message: error instanceof Error ? error.message : "Payment failed",
        },
      };
    }
  },
};
