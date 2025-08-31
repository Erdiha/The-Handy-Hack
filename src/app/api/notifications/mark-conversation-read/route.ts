import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { db } from "@/lib/db";
import { notifications, messages } from "@/lib/schema"; // Add messages import
import { eq, and, ne } from "drizzle-orm"; // Add ne import

export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { conversationId } = await request.json();
    const userId = parseInt(request.user!.id);

    // Update notifications table (existing)
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.conversationId, parseInt(conversationId))
        )
      );

    // CRITICAL FIX: Also update messages table
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, parseInt(conversationId)),
          ne(messages.senderId, userId) // Only mark messages NOT sent by current user
        )
      );

    console.log(
      "Marked conversation as read:",
      conversationId,
      "for user:",
      userId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark conversation as read:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
});
