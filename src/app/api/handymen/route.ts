import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  handymanProfiles,
  neighborhoods,
  handymanServices,
  reviews,
} from "@/lib/schema";
import { eq, avg, count } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get("service");
    const availableOnly = searchParams.get("availableOnly") === "true";

    console.log("Fetching handymen with filters:", { service, availableOnly });

    // Get handymen with their profiles and neighborhoods
    const handymenData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        bio: handymanProfiles.bio,
        hourlyRate: handymanProfiles.hourlyRate,
        isVerified: handymanProfiles.isVerified,
        isAvailable: handymanProfiles.isAvailable, // ADD THIS LINE
        neighborhoodName: neighborhoods.name,
      })
      .from(users)
      .innerJoin(handymanProfiles, eq(users.id, handymanProfiles.userId))
      .leftJoin(
        neighborhoods,
        eq(handymanProfiles.neighborhoodId, neighborhoods.id)
      )
      .where(eq(users.role, "handyman"));

    if (handymenData.length === 0) {
      return NextResponse.json({
        success: true,
        handymen: [],
        total: 0,
        message: "No handymen found. Have you run the seed script?",
      });
    }

    // Get services and reviews for each handyman
    const enrichedHandymen = await Promise.all(
      handymenData.map(async (handyman) => {
        // Get services
        const services = await db
          .select({
            serviceName: handymanServices.serviceName,
          })
          .from(handymanServices)
          .where(eq(handymanServices.handymanId, handyman.id));

        // Get review stats
        const reviewStats = await db
          .select({
            avgRating: avg(reviews.rating),
            reviewCount: count(reviews.id),
          })
          .from(reviews)
          .where(eq(reviews.handymanId, handyman.id));

        const rating = reviewStats[0]?.avgRating
          ? parseFloat(reviewStats[0].avgRating)
          : 4.5;
        const reviewCount = reviewStats[0]?.reviewCount || 0;

        return {
          id: handyman.id.toString(),
          name: handyman.name,
          bio:
            handyman.bio ||
            "Experienced local handyman ready to help with your projects.",
          services: services.map((s) => s.serviceName),
          hourlyRate: parseFloat(handyman.hourlyRate || "50"),
          rating: Math.round(rating * 10) / 10,
          reviewCount,
          distance: 0.5 + Math.random() * 3,
          neighborhood: handyman.neighborhoodName || "Local Area",
          responseTime: ["15 minutes", "30 minutes", "1 hour"][
            Math.floor(Math.random() * 3)
          ],
          isAvailable: handyman.isAvailable, // CHANGED: use real data
        };
      })
    );

    // Apply filters
    let filteredHandymen = enrichedHandymen;

    if (service && service !== "All Services") {
      filteredHandymen = filteredHandymen.filter((handyman) =>
        handyman.services.some(
          (s) =>
            s.toLowerCase().includes(service.toLowerCase()) ||
            service.toLowerCase().includes(s.toLowerCase())
        )
      );
    }

    if (availableOnly) {
      filteredHandymen = filteredHandymen.filter(
        (handyman) => handyman.isAvailable
      );
    }

    console.log(`Returning ${filteredHandymen.length} handymen`);

    return NextResponse.json({
      success: true,
      handymen: filteredHandymen,
      total: filteredHandymen.length,
    });
  } catch (error) {
    console.error("Error fetching handymen:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch handymen",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
