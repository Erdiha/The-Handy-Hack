import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handymanProfiles } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq } from "drizzle-orm";

export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { isAvailable } = await request.json();
    const userId = parseInt(request.user!.id);

    // Update availability status
    await db
      .update(handymanProfiles)
      .set({ isAvailable })
      .where(eq(handymanProfiles.userId, userId));

    return NextResponse.json({
      success: true,
      isAvailable,
      message: `You are now ${isAvailable ? "available" : "offline"}`,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
});
