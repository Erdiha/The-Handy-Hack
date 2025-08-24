//api/customer/availability/route
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { db } from "@/lib/db";
import { customerProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);

    // Get customer profile
    const [profile] = await db
      .select({
        isAvailable: customerProfiles.isAvailable,
      })
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, userId))
      .limit(1);

    // If profile doesn't exist, create one with default values
    if (!profile) {
      const [newProfile] = await db
        .insert(customerProfiles)
        .values({
          userId,
          isAvailable: true, // Default to available
        })
        .returning({ isAvailable: customerProfiles.isAvailable });

      return NextResponse.json({
        success: true,
        isAvailable: newProfile.isAvailable,
      });
    }

    return NextResponse.json({
      success: true,
      isAvailable: profile.isAvailable,
    });
  } catch (error) {
    console.error("Error fetching customer availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability status" },
      { status: 500 }
    );
  }
});
