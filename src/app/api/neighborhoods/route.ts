import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { neighborhoods } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const neighborhoodList = await db
      .select({
        id: neighborhoods.id,
        name: neighborhoods.name,
        slug: neighborhoods.slug,
        city: neighborhoods.city,
        state: neighborhoods.state,
      })
      .from(neighborhoods)
      .orderBy(asc(neighborhoods.name));

    return NextResponse.json({
      success: true,
      neighborhoods: neighborhoodList,
    });
  } catch (error) {
    console.error("Error fetching neighborhoods:", error);
    return NextResponse.json(
      { error: "Failed to fetch neighborhoods" },
      { status: 500 }
    );
  }
}
