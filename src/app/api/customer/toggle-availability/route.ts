//api/toggle-availability/route
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { db } from "@/lib/db";
import { customerProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { isAvailable } = await request.json();
    const userId = parseInt(request.user!.id);

    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, userId))
      .limit(1);

    if (!existingProfile) {
      // Create profile if it doesn't exist
      await db.insert(customerProfiles).values({
        userId,
        isAvailable,
      });
    } else {
      // Update existing profile
      await db
        .update(customerProfiles)
        .set({
          isAvailable,
          updatedAt: new Date(),
        })
        .where(eq(customerProfiles.userId, userId));
    }

    return NextResponse.json({
      success: true,
      isAvailable,
      message: `Status updated to ${isAvailable ? "Available" : "Offline"}`,
    });
  } catch (error) {
    console.error("Error toggling customer availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
});
