// /src/app/api/verify-address/route.ts
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface AddressValidationResult {
  isValid: boolean;
  standardizedAddress?: string;
  latitude?: number;
  longitude?: number;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  confidence?: "high" | "medium" | "low";
  error?: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  importance: number;
}

async function validateAddress(
  address: string
): Promise<AddressValidationResult> {
  try {
    const cleanAddress = address.trim();
    if (!cleanAddress) {
      return { isValid: false, error: "Address is required" };
    }

    // Use OpenStreetMap Nominatim (completely free)
    const encodedAddress = encodeURIComponent(cleanAddress);
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodedAddress}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TheHandyHack-App/1.0 (contact@thehandyhack.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: NominatimResponse[] = await response.json();

    if (!data || data.length === 0) {
      return {
        isValid: false,
        error: "Address not found. Please check spelling and try again.",
      };
    }

    const result = data[0];

    // Determine confidence based on importance score and address completeness
    let confidence: "high" | "medium" | "low" = "low";
    if (result.importance > 0.6 && result.address.house_number) {
      confidence = "high";
    } else if (result.importance > 0.4) {
      confidence = "medium";
    }

    // Build standardized address
    const addressParts = [];
    if (result.address.house_number)
      addressParts.push(result.address.house_number);
    if (result.address.road) addressParts.push(result.address.road);
    if (result.address.city) addressParts.push(result.address.city);
    if (result.address.state) addressParts.push(result.address.state);
    if (result.address.postcode) addressParts.push(result.address.postcode);

    const standardizedAddress =
      addressParts.length > 0 ? addressParts.join(", ") : result.display_name;

    return {
      isValid: true,
      standardizedAddress,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      neighborhood: result.address.neighbourhood || result.address.suburb,
      city: result.address.city,
      state: result.address.state,
      postalCode: result.address.postcode,
      confidence,
    };
  } catch (error) {
    console.error("Address validation error:", error);
    return {
      isValid: false,
      error: "Unable to verify address. Please try again.",
    };
  }
}

// POST - Verify and save user address
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { address } = await request.json();
    const userId = parseInt(request.user!.id);

    if (!address?.trim()) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    console.log(`🏠 Verifying address for user ${userId}: ${address}`);

    // Validate address using OpenStreetMap
    const validation = await validateAddress(address);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid address" },
        { status: 400 }
      );
    }

    // Update user with verified address
    await db
      .update(users)
      .set({
        fullAddress: validation.standardizedAddress,
        latitude: validation.latitude?.toString(),
        longitude: validation.longitude?.toString(),
        addressVerified: true,
      })
      .where(eq(users.id, userId));

    console.log(`✅ Address verified and saved for user ${userId}`);

    return NextResponse.json({
      success: true,
      address: {
        original: address,
        standardized: validation.standardizedAddress,
        confidence: validation.confidence,
        neighborhood: validation.neighborhood,
        city: validation.city,
        state: validation.state,
      },
    });
  } catch (error) {
    console.error("Address verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify address" },
      { status: 500 }
    );
  }
});

// GET - Get user's current address verification status
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);

    const user = await db
      .select({
        fullAddress: users.fullAddress,
        addressVerified: users.addressVerified,
        latitude: users.latitude,
        longitude: users.longitude,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      addressVerified: user[0].addressVerified || false,
      fullAddress: user[0].fullAddress,
      hasCoordinates: !!(user[0].latitude && user[0].longitude),
    });
  } catch (error) {
    console.error("Error fetching address status:", error);
    return NextResponse.json(
      { error: "Failed to fetch address status" },
      { status: 500 }
    );
  }
});
