import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { conversationId } = await request.json();
    const userId = parseInt(request.user!.id);

    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.conversationId, parseInt(conversationId))
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
});
