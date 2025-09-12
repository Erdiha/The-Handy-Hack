import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { db } from "@/lib/db";
import { handymanServices } from "@/lib/schema";
import { eq } from "drizzle-orm";

// PATCH - Update handyman services
export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { services } = await request.json();
    const userId = parseInt(request.user!.id);

    console.log(
      "🔧 Updating services for user:",
      userId,
      "Services:",
      services
    );

    // Check if user is a handyman
    if (request.user!.role !== "handyman") {
      return NextResponse.json(
        { error: "Only handymen can update services" },
        { status: 403 }
      );
    }

    // Validate input
    if (!Array.isArray(services) || services.length < 1) {
      return NextResponse.json(
        { error: "Please select at least 2 services" },
        { status: 400 }
      );
    }

    // Delete existing services for this handyman
    await db
      .delete(handymanServices)
      .where(eq(handymanServices.handymanId, userId));

    console.log("🗑️ Deleted existing services");

    // Insert new services
    const newServices = services.map((serviceName) => ({
      handymanId: userId,
      serviceName: serviceName,
    }));

    await db.insert(handymanServices).values(newServices);

    console.log("✅ Inserted new services:", services);

    return NextResponse.json({
      success: true,
      services: services,
      message: `Updated to ${services.length} services`,
    });
  } catch (error) {
    console.error("❌ Error updating services:", error);
    return NextResponse.json(
      { error: "Failed to update services" },
      { status: 500 }
    );
  }
});

// GET - Fetch handyman services (bonus - we'll use this later)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);

    const services = await db
      .select({
        serviceName: handymanServices.serviceName,
      })
      .from(handymanServices)
      .where(eq(handymanServices.handymanId, userId));

    return NextResponse.json({
      success: true,
      services: services.map((s) => s.serviceName),
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
});
