import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { db } from "@/lib/db";
import { handymanProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

// GET - Fetch handyman availability schedule
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  console.log(
    "🔍 API called by user:",
    request.user!.id,
    request.user!.name,
    request.user!.role
  );

  try {
    const userId = parseInt(request.user!.id);

    const profile = await db
      .select({
        availabilitySchedule: handymanProfiles.availabilitySchedule,
      })
      .from(handymanProfiles)
      .where(eq(handymanProfiles.userId, userId))
      .limit(1);

    if (!profile[0]) {
      return NextResponse.json(
        { error: "Handyman profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      availability: profile[0].availabilitySchedule || {
        // Default availability data
        weeklySchedule: {
          Monday: { start: "09:00", end: "17:00", enabled: true },
          Tuesday: { start: "09:00", end: "17:00", enabled: true },
          Wednesday: { start: "09:00", end: "17:00", enabled: true },
          Thursday: { start: "09:00", end: "17:00", enabled: true },
          Friday: { start: "09:00", end: "17:00", enabled: true },
          Saturday: { start: "10:00", end: "16:00", enabled: false },
          Sunday: { start: "10:00", end: "16:00", enabled: false },
        },
        responseTime: "1 hour",
        vacationMode: false,
        vacationUntil: "",
        instantBooking: false,
        emergencyAvailable: true,
        bufferTime: 30,
      },
    });
  } catch (error) {
    console.error("Error fetching availability schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability schedule" },
      { status: 500 }
    );
  }
});
