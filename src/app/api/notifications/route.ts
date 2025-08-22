import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { db } from "@/lib/db";
import { notifications, messages, conversations, users } from "@/lib/schema";
import { eq, and, or, isNull, desc, count } from "drizzle-orm";

// GET - Fetch notifications for current user
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // Fetch actual notification records
    let query = db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        actionUrl: notifications.actionUrl,
        conversationId: notifications.conversationId,
        jobId: notifications.jobId,
        priority: notifications.priority,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    // Filter for unread only if requested
    if (unreadOnly) {
      query = db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          body: notifications.body,
          actionUrl: notifications.actionUrl,
          conversationId: notifications.conversationId,
          jobId: notifications.jobId,
          priority: notifications.priority,
          readAt: notifications.readAt,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(
          and(eq(notifications.userId, userId), isNull(notifications.readAt))
        )
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
    }

    const userNotifications = await query;

    // Count unread notifications
    const unreadCountResult = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt))
      );

    // ALSO count unread messages for backward compatibility
    const unreadMessageCount = await db
      .select({ count: count() })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(
        and(
          eq(messages.isRead, false),
          // Message NOT sent by current user
          or(
            and(
              eq(conversations.participant1, userId),
              eq(conversations.participant2, messages.senderId)
            ),
            and(
              eq(conversations.participant2, userId),
              eq(conversations.participant1, messages.senderId)
            )
          )
        )
      );

    // const totalUnreadCount =
    //   (unreadCountResult[0]?.count || 0) + (unreadMessageCount[0]?.count || 0);

    return NextResponse.json({
      success: true,
      notifications: userNotifications.map((notif) => ({
        id: notif.id.toString(),
        type: notif.type,
        title: notif.title,
        body: notif.body,
        actionUrl: notif.actionUrl,
        conversationId: notif.conversationId?.toString(),
        jobId: notif.jobId?.toString(),
        priority: notif.priority,
        isRead: !!notif.readAt,
        createdAt: notif.createdAt.toISOString(),
        timeAgo: getTimeAgo(notif.createdAt),
      })),
      //unreadCount: totalUnreadCount,
      unreadMessageCount: unreadMessageCount[0]?.count || 0, // For backward compatibility
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
});

// PATCH - Mark notification as read
export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const userId = parseInt(request.user!.id);

    // Mark notification as read
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, parseInt(notificationId)),
          eq(notifications.userId, userId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
});

// Helper function to get time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
