// Replace /api/stripe/onboard/route.ts with this:

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "handyman") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get user's Stripe data from database
    const user = await db
      .select({
        stripeConnectAccountId: users.stripeConnectAccountId,
        stripeOnboardingComplete: users.stripeOnboardingComplete,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let accountId = user[0].stripeConnectAccountId;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        metadata: { userId: userId.toString() },
      });

      accountId = account.id;

      // Save account ID to database
      await db
        .update(users)
        .set({ stripeConnectAccountId: accountId })
        .where(eq(users.id, userId));
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/settings?tab=payment`,
      return_url: `${process.env.NEXTAUTH_URL}/settings?tab=payment&onboarding=complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({ success: true, url: accountLink.url });
  } catch (error) {
    console.error("Stripe onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to create onboarding link" },
      { status: 500 }
    );
  }
}
