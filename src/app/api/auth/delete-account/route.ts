// src/app/api/auth/delete-account/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  handymanProfiles,
  customerProfiles,
  jobs,
  messages,
  conversations,
  notifications,
  reviews,
  payments,
  supportTickets,
  handymanServices,
} from "@/lib/schema";
import { eq, or } from "drizzle-orm";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    console.log(`🗑️ Starting account deletion for user: ${userId}`);

    // Delete data sequentially (no transaction support in neon-http)
    try {
      // 1. Delete handyman-specific data
      if (session.user.role === "handyman") {
        await db
          .delete(handymanServices)
          .where(eq(handymanServices.handymanId, userId));
        await db
          .delete(handymanProfiles)
          .where(eq(handymanProfiles.userId, userId));
        console.log("✅ Deleted handyman data");
      }

      // 2. Delete customer-specific data
      if (session.user.role === "customer") {
        await db
          .delete(customerProfiles)
          .where(eq(customerProfiles.userId, userId));
        console.log("✅ Deleted customer data");
      }

      // 3. Delete notifications
      await db.delete(notifications).where(eq(notifications.userId, userId));
      console.log("✅ Deleted notifications");

      // 4. Delete support tickets reported by user
      await db
        .delete(supportTickets)
        .where(eq(supportTickets.reportedBy, userId));
      console.log("✅ Deleted support tickets");

      // 5. Delete reviews written by or about user
      await db
        .delete(reviews)
        .where(
          or(eq(reviews.customerId, userId), eq(reviews.handymanId, userId))
        );
      console.log("✅ Deleted reviews");

      // 6. Delete messages from conversations
      await db.delete(messages).where(eq(messages.senderId, userId));
      console.log("✅ Deleted messages");

      // 7. Delete conversations where user was a participant
      await db
        .delete(conversations)
        .where(
          or(
            eq(conversations.participant1, userId),
            eq(conversations.participant2, userId)
          )
        );
      console.log("✅ Deleted conversations");

      // 8. Handle payments FIRST (before jobs) - delete payments involving this user
      if (session.user.role === "customer") {
        await db.delete(payments).where(eq(payments.customerId, userId));
      } else if (session.user.role === "handyman") {
        await db.delete(payments).where(eq(payments.handymanId, userId));
      }
      console.log("✅ Updated payment records");

      // 9. Handle jobs AFTER payments - delete jobs posted by customer, nullify handyman assignments
      if (session.user.role === "customer") {
        // Delete jobs posted by the customer (now safe since payments are gone)
        await db.delete(jobs).where(eq(jobs.postedBy, userId));
      } else if (session.user.role === "handyman") {
        // Just remove handyman assignment (acceptedBy can be null)
        await db
          .update(jobs)
          .set({ acceptedBy: null })
          .where(eq(jobs.acceptedBy, userId));
      }
      console.log("✅ Updated job records");

      // 10. Finally, delete the user account
      await db.delete(users).where(eq(users.id, userId));
      console.log("✅ Deleted user account");
    } catch (deleteError) {
      console.error("Error during deletion:", deleteError);
      throw deleteError;
    }

    console.log(`🎉 Account deletion completed for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("💥 Account deletion error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
