// /app/api/onboarding/route.ts - Your fixed version
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { neighborhood, address, phone, bio, services, hourlyRate } = body;

    console.log("🔄 Processing onboarding:", {
      neighborhood,
      phone,
      bio,
      services,
      hourlyRate,
    }); // Debug

    // ✅ Add validation for required fields
    if (!neighborhood || !phone) {
      return NextResponse.json(
        { error: "Neighborhood and phone are required" },
        { status: 400 }
      );
    }

    // ✅ Validate handyman-specific fields
    if (session.user.role === "handyman") {
      if (!bio || !services || !hourlyRate) {
        return NextResponse.json(
          { error: "Bio, services, and hourly rate are required for handymen" },
          { status: 400 }
        );
      }

      if (!Array.isArray(services) || services.length < 2) {
        return NextResponse.json(
          { error: "Please select at least 2 services" },
          { status: 400 }
        );
      }

      // ✅ Validate hourly rate is a valid number (but store as string)
      const rate = parseFloat(hourlyRate);
      if (isNaN(rate) || rate <= 0) {
        return NextResponse.json(
          { error: "Please enter a valid hourly rate" },
          { status: 400 }
        );
      }
    }

    // Update user phone
    await db
      .update(users)
      .set({ phone })
      .where(eq(users.id, parseInt(session.user.id)));

    console.log("✅ Updated user phone");

    // Find or create neighborhood
    let neighborhoodRecord = await db
      .select()
      .from(neighborhoods)
      .where(eq(neighborhoods.name, neighborhood))
      .limit(1);

    if (neighborhoodRecord.length === 0) {
      // ✅ Include slug field as required by schema
      neighborhoodRecord = await db
        .insert(neighborhoods)
        .values({
          name: neighborhood,
          slug: neighborhood.toLowerCase().replace(/\s+/g, "-"), // Convert "Echo Park" to "echo-park"
          city: "Los Angeles",
          state: "CA",
        })
        .returning();

      console.log("✅ Created neighborhood:", neighborhood);
    }

    // If handyman, create profile
    if (session.user.role === "handyman") {
      // ✅ Use only fields that exist in your original schema
      await db.insert(handymanProfiles).values({
        userId: parseInt(session.user.id),
        bio,
        hourlyRate: hourlyRate, // ✅ Keep as string
        neighborhoodId: neighborhoodRecord[0].id,
        isVerified: false,
      });

      // After the handymanProfiles insert, add this:
      if (services && services.length > 0) {
        interface ServiceRecord {
          handymanId: number;
          serviceName: string;
          description: string;
          basePrice: string;
        }

        const serviceRecords: ServiceRecord[] = services.map(
          (service: string) => ({
            handymanId: parseInt(session.user.id),
            serviceName: service,
            description: `${service} services`,
            basePrice: hourlyRate, // Use hourly rate as base price
          })
        );

        await db.insert(handymanServices).values(serviceRecords);
        console.log("✅ Created handyman services:", services);
      }

      console.log(
        "✅ Created handyman profile (services not saved - schema limitation)"
      );
    }

    console.log("🎉 Onboarding completed successfully");

    return NextResponse.json(
      {
        success: true, // ✅ Add success flag
        message: "Onboarding completed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("💥 Onboarding error:", error);

    // ✅ Better error handling
    if (error && typeof error === "object" && "code" in error) {
      // Database constraint errors
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Profile already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to complete onboarding",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
