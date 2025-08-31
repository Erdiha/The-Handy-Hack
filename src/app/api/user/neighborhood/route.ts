import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { db } from "@/lib/db";
import {
  users,
  customerProfiles,
  handymanProfiles,
  neighborhoods,
} from "@/lib/schema";
import { eq } from "drizzle-orm";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);
    const userRole = request.user!.role;

    let userNeighborhood = null;

    if (userRole === "customer") {
      // Get customer neighborhood (stored as text)
      const customer = await db
        .select({ neighborhood: customerProfiles.neighborhood })
        .from(customerProfiles)
        .where(eq(customerProfiles.userId, userId))
        .limit(1);

      userNeighborhood = customer[0]?.neighborhood || null;
    } else if (userRole === "handyman") {
      // Get handyman neighborhood (stored as foreign key)
      const handyman = await db
        .select({ name: neighborhoods.name })
        .from(handymanProfiles)
        .innerJoin(
          neighborhoods,
          eq(handymanProfiles.neighborhoodId, neighborhoods.id)
        )
        .where(eq(handymanProfiles.userId, userId))
        .limit(1);

      userNeighborhood = handyman[0]?.name || null;
    }

    return NextResponse.json({
      success: true,
      neighborhood: userNeighborhood,
    });
  } catch (error) {
    console.error("Error fetching user neighborhood:", error);
    return NextResponse.json(
      { error: "Failed to fetch user neighborhood" },
      { status: 500 }
    );
  }
});
