// src/app/api/notifications/preferences/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notificationPreferences } from "@/lib/schema";
import { eq } from "drizzle-orm";

// GET - Fetch notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get preferences or return defaults
    const preferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    const defaultPreferences = {
      browser: false,
      sound: false,
      email: false,
      sms: false,
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
    };

    return NextResponse.json({
      success: true,
      preferences: preferences[0] || defaultPreferences,
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PATCH - Update notification preferences
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();

    console.log("🔔 Updating notification preferences:", body);

    // Check if preferences exist
    const existingPreferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    const updatedData = {
      userId,
      browser: body.browser ?? true,
      sound: body.sound ?? true,
      email: body.email ?? true,
      sms: body.sms ?? false,
      quietHoursEnabled: body.quietHoursEnabled ?? false,
      quietHoursStart: body.quietHoursStart ?? "22:00",
      quietHoursEnd: body.quietHoursEnd ?? "08:00",
      updatedAt: new Date(),
    };

    if (existingPreferences[0]) {
      // Update existing preferences
      await db
        .update(notificationPreferences)
        .set(updatedData)
        .where(eq(notificationPreferences.userId, userId));
    } else {
      // Create new preferences
      await db.insert(notificationPreferences).values({
        ...updatedData,
        createdAt: new Date(),
      });
    }

    console.log("✅ Notification preferences updated successfully");

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences: updatedData,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
