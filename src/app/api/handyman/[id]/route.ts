import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  handymanProfiles,
  neighborhoods,
  handymanServices,
  reviews,
} from "@/lib/schema";
import { eq, desc, avg, count, and } from "drizzle-orm";
import { jobs } from "@/lib/schema";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params Promise in Next.js 15+
    const { id } = await params;
    const handymanId = parseInt(id);

    if (isNaN(handymanId)) {
      return NextResponse.json(
        { error: "Invalid handyman ID" },
        { status: 400 }
      );
    }

    // Get handyman basic info
    const handyman = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        bio: handymanProfiles.bio,
        hourlyRate: handymanProfiles.hourlyRate,
        isVerified: handymanProfiles.isVerified,
        neighborhoodName: neighborhoods.name,
        neighborhoodId: handymanProfiles.neighborhoodId,
        createdAt: handymanProfiles.createdAt,
      })
      .from(users)
      .innerJoin(handymanProfiles, eq(users.id, handymanProfiles.userId))
      .leftJoin(
        neighborhoods,
        eq(handymanProfiles.neighborhoodId, neighborhoods.id)
      )
      .where(eq(users.id, handymanId))
      .limit(1);

    if (!handyman[0]) {
      return NextResponse.json(
        { error: "Handyman not found" },
        { status: 404 }
      );
    }

    // Get services
    const services = await db
      .select({
        name: handymanServices.serviceName,
        description: handymanServices.description,
        basePrice: handymanServices.basePrice,
      })
      .from(handymanServices)
      .where(eq(handymanServices.handymanId, handymanId));
    // 🔍 DEBUG: Check services query
    console.log("🔍 Services found:", services);
    console.log("🔍 Handyman ID:", handymanId);
    // Get review stats
    const reviewStats = await db
      .select({
        avgRating: avg(reviews.rating),
        reviewCount: count(reviews.id),
      })
      .from(reviews)
      .where(eq(reviews.handymanId, handymanId));

    // Get actual reviews with customer names
    const reviewsData = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        serviceType: reviews.serviceType,
        createdAt: reviews.createdAt,
        customerName: users.name,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.customerId, users.id))
      .where(eq(reviews.handymanId, handymanId))
      .orderBy(desc(reviews.createdAt))
      .limit(10);

    // Calculate stats
    const rating = reviewStats[0]?.avgRating
      ? parseFloat(reviewStats[0].avgRating)
      : 0;
    const reviewCount = reviewStats[0]?.reviewCount || 0;
    // Get real completed jobs count from database
    const completedJobsResult = await db
      .select({
        count: count(jobs.id),
      })
      .from(jobs)
      .where(
        and(eq(jobs.acceptedBy, handymanId), eq(jobs.status, "completed"))
      );

    const completedJobs = completedJobsResult[0]?.count || 0;
    // Format reviews
    const formattedReviews = reviewsData.map((review) => ({
      id: review.id,
      customerName:
        review.customerName.split(" ")[0] +
        " " +
        review.customerName.split(" ")[1]?.charAt(0) +
        ".", // "John D."
      rating: review.rating,
      comment: review.comment || "",
      date: getRelativeTime(review.createdAt),
      serviceType: review.serviceType || "General Service",
    }));

    // Transform services
    const transformedServices =
      services.length > 0
        ? services.map((service) => ({
            name: service.name,
            description:
              service.description ||
              "Professional service with attention to detail",
            basePrice: service.basePrice || handyman[0].hourlyRate || "50",
          }))
        : [
            // Default services if none in database
            {
              name: "General Repairs",
              description:
                "Fixing things around the house, small repairs, maintenance",
              basePrice: handyman[0].hourlyRate || "50",
            },
          ];

    const profileData = {
      id: handyman[0].id,
      name: handyman[0].name,
      bio:
        handyman[0].bio ||
        "Experienced local handyman ready to help with your projects.",
      hourlyRate: handyman[0].hourlyRate || "50",
      neighborhood: handyman[0].neighborhoodName || "Local Area",
      phone: handyman[0].phone,
      email: handyman[0].email,
      isVerified: handyman[0].isVerified || false,
      joinedDate: handyman[0].createdAt,

      services: transformedServices,

      availability: {
        isAvailable: true,
        responseTime: "15 minutes",
        workingHours: "Mon-Sat: 8am-6pm",
        weekendAvailable: true,
      },

      stats: {
        rating: Math.round(rating * 10) / 10,
        reviewCount,
        completedJobs,
        responseRate: "98%",
        onTimeRate: "95%",
      },

      reviews: formattedReviews,
    };

    return NextResponse.json({
      handyman: profileData,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching handyman profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch handyman profile" },
      { status: 500 }
    );
  }
}

// Helper function
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 60) {
    return minutes <= 1 ? "1 minute ago" : `${minutes} minutes ago`;
  } else if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  } else if (days < 7) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  } else if (weeks < 4) {
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  } else {
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
}
