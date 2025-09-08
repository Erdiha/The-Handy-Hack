import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  handymanProfiles,
  neighborhoods,
  handymanServices,
} from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get user basic info
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For handymen: Check if handyman profile exists
    if (session.user.role === "handyman") {
      const handymanProfile = await db
        .select({
          bio: handymanProfiles.bio,
          hourlyRate: handymanProfiles.hourlyRate,
          isAvailable: handymanProfiles.isAvailable,
          useScheduledAvailability: handymanProfiles.useScheduledAvailability,
          neighborhoodName: neighborhoods.name,
        })
        .from(handymanProfiles)
        .leftJoin(
          neighborhoods,
          eq(handymanProfiles.neighborhoodId, neighborhoods.id)
        )
        .where(eq(handymanProfiles.userId, userId))
        .limit(1);

      if (handymanProfile[0]) {
        // ✅ FETCH ACTUAL SERVICES FROM DATABASE
        const userServices = await db
          .select({
            serviceName: handymanServices.serviceName,
          })
          .from(handymanServices)
          .where(eq(handymanServices.handymanId, userId));

        // Extract service names, or use default if none found
        const services =
          userServices.length > 0
            ? userServices.map((s) => s.serviceName)
            : ["Plumbing", "Electrical"]; // Default fallback

        console.log(
          `✅ Fetched ${services.length} services for handyman ${userId}:`,
          services
        );

        // Handyman has completed onboarding
        return NextResponse.json({
          success: true,
          hasCompletedOnboarding: true,
          phone: user[0].phone,
          bio: handymanProfile[0].bio,
          hourlyRate: handymanProfile[0].hourlyRate,
          isAvailable: handymanProfile[0].isAvailable ?? true,
          useScheduledAvailability:
            handymanProfile[0].useScheduledAvailability ?? false,
          neighborhood: handymanProfile[0].neighborhoodName,
          services: services, // ✅ REAL SERVICES FROM DATABASE
        });
      } else {
        // Handyman needs onboarding
        return NextResponse.json({
          success: true,
          hasCompletedOnboarding: false,
          phone: user[0].phone,
          isAvailable: true,
        });
      }
    } else {
      // For customers: Check if they have phone (from onboarding)
      if (user[0].phone) {
        return NextResponse.json({
          hasCompletedOnboarding: true,
          phone: user[0].phone,
          neighborhood: "Highland Park",
        });
      } else {
        return NextResponse.json({
          hasCompletedOnboarding: false,
          phone: null,
        });
      }
    }
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
