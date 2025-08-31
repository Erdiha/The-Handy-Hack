import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  handymanProfiles,
  neighborhoods,
  handymanServices,
  reviews,
} from "@/lib/schema";
import { eq, desc, avg, count, gte, lte, and, or } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get("service");
    const availableOnly = searchParams.get("availableOnly") === "true";
    const priceRange = searchParams.get("priceRange");
    const rating = searchParams.get("rating");
    const neighborhood = searchParams.get("neighborhood");

    console.log("Fetching handymen with filters:", {
      service,
      availableOnly,
      priceRange,
      rating,
    });

    // Get handymen with profiles
    const handymenQuery = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        bio: handymanProfiles.bio,
        hourlyRate: handymanProfiles.hourlyRate,
        isVerified: handymanProfiles.isVerified,
        isAvailable: handymanProfiles.isAvailable,
        neighborhoodName: neighborhoods.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(handymanProfiles, eq(users.id, handymanProfiles.userId))
      .leftJoin(
        neighborhoods,
        eq(handymanProfiles.neighborhoodId, neighborhoods.id)
      )
      .where(eq(users.role, "handyman"));

    let handymen = await handymenQuery;

    // Apply availability filter
    if (availableOnly) {
      handymen = handymen.filter((h) => h.isAvailable);
    }

    // Apply neighborhood filter
    if (neighborhood && neighborhood !== "All Areas") {
      handymen = handymen.filter(
        (handyman) => handyman.neighborhoodName === neighborhood
      );
    }
    // Apply price range filter
    if (priceRange && priceRange !== "All Prices") {
      handymen = handymen.filter((handyman) => {
        const rate = parseFloat(handyman.hourlyRate || "0");
        switch (priceRange) {
          case "under-50":
            return rate < 50;
          case "50-80":
            return rate >= 50 && rate <= 80;
          case "80-120":
            return rate >= 80 && rate <= 120;
          case "over-120":
            return rate > 120;
          default:
            return true;
        }
      });
    }

    // Get services and reviews for each handyman
    const transformedHandymen = await Promise.all(
      handymen.map(async (handyman) => {
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
          : 0;
        const reviewCount = reviewStats[0]?.reviewCount || 0;

        return {
          id: handyman.id.toString(),
          name: handyman.name,
          bio: handyman.bio || "Experienced local handyman",
          hourlyRate: handyman.hourlyRate || "50",
          neighborhood: handyman.neighborhoodName || "Local Area",
          isAvailable: handyman.isAvailable || false,
          services: services.map((s) => s.serviceName),
          rating: Math.round(rating * 10) / 10,
          reviewCount,
          distance: Math.random() * 10 + 1, // Mock distance for now
          responseTime: "15 minutes", // Mock response time
        };
      })
    );

    // Apply service filter
    let filteredHandymen = transformedHandymen;
    if (service && service !== "All Services") {
      filteredHandymen = transformedHandymen.filter((handyman) =>
        handyman.services.includes(service)
      );
    }

    // Apply rating filter
    if (rating && rating !== "All Ratings") {
      const minRating = parseFloat(rating);
      filteredHandymen = filteredHandymen.filter(
        (handyman) => handyman.rating >= minRating
      );
    }

    console.log(`Returning ${filteredHandymen.length} handymen`);

    return NextResponse.json({
      success: true,
      handymen: filteredHandymen,
    });
  } catch (error) {
    console.error("Error fetching handymen:", error);
    return NextResponse.json(
      { error: "Failed to fetch handymen" },
      { status: 500 }
    );
  }
}
