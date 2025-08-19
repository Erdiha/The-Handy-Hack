import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handymanProfiles } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq } from "drizzle-orm";

export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { hourlyRate } = await request.json();
    const userId = parseInt(request.user!.id);

    // Validate rate
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate <= 0 || rate > 500) {
      return NextResponse.json(
        { error: "Invalid hourly rate" },
        { status: 400 }
      );
    }

    // Update handyman profile
    await db
      .update(handymanProfiles)
      .set({ hourlyRate: hourlyRate.toString() })
      .where(eq(handymanProfiles.userId, userId));

    return NextResponse.json({
      success: true,
      message: "Hourly rate updated successfully",
    });
  } catch (error) {
    console.error("Error updating rate:", error);
    return NextResponse.json(
      { error: "Failed to update rate" },
      { status: 500 }
    );
  }
});
