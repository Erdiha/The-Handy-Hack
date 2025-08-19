import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { db } from "@/lib/db";
import { handymanProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

//  Update handyman availability schedule
export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const availabilityData = await request.json();
    const userId = parseInt(request.user!.id);

    console.log("🕒 Updating availability for user:", userId);
    console.log("📅 New availability data:", availabilityData);

    // Check if user is a handyman
    if (request.user!.role !== "handyman") {
      return NextResponse.json(
        { error: "Only handymen can update availability schedule" },
        { status: 403 }
      );
    }

    // For now, we'll store the availability data as JSON in the handyman profile
    // Later you could create a separate availability table for more complex queries
    await db
      .update(handymanProfiles)
      .set({
        availabilitySchedule: availabilityData, // You'll need to add this column
        updatedAt: new Date(),
      })
      .where(eq(handymanProfiles.userId, userId));

    console.log("✅ Availability schedule updated successfully");

    return NextResponse.json({
      success: true,
      message: "Availability schedule updated successfully",
      availability: availabilityData,
    });
  } catch (error) {
    console.error("❌ Error updating availability schedule:", error);
    return NextResponse.json(
      { error: "Failed to update availability schedule" },
      { status: 500 }
    );
  }
});

// GET - Fetch handyman availability schedule
export const GET = withAuth(async (request: AuthenticatedRequest) => {
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
        // Default availability if none set
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
