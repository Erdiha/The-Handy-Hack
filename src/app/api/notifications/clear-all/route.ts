import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);

    // Delete all notifications for the user
    await db.delete(notifications).where(eq(notifications.userId, userId));

    return NextResponse.json({
      success: true,
      message: "All notifications cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
});
