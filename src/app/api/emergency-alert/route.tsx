import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs, users, notifications } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { problem, location, phone } = await request.json();

    // Create emergency job
    const emergencyJob = await db
      .insert(jobs)
      .values({
        title: `🚨 EMERGENCY: ${problem}`,
        description: `URGENT EMERGENCY REQUEST\n\nProblem: ${problem}\nLocation: ${location}\nContact: ${phone}\n\nCustomer needs immediate assistance!`,
        category: "Emergency",
        urgency: "emergency",
        budget: "fixed",
        budgetAmount: "150", // Minimum emergency rate
        location: location,
        postedBy: parseInt(session.user.id),
        status: "open", // Special emergency status
      })
      .returning({ id: jobs.id });

    // Find all available handymen
    const availableHandymen = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(and(eq(users.role, "handyman"), eq(users.isAvailable, true)));

    // Send notifications to all available handymen
    const notifications_to_send = availableHandymen.map((handyman) => ({
      userId: handyman.id,
      type: "emergency_alert",
      title: "🚨 EMERGENCY JOB ALERT",
      body: `Emergency job in ${location}: ${problem}. Premium rates apply!`,
      jobId: emergencyJob[0].id,
      priority: "urgent",
      actionUrl: `/jobs`, // They'll see it highlighted on jobs page
    }));

    if (notifications_to_send.length > 0) {
      await db.insert(notifications).values(notifications_to_send);
    }

    console.log(
      `🚨 Emergency alert sent to ${availableHandymen.length} handymen`
    );

    return NextResponse.json({
      success: true,
      message: `Emergency alert sent to ${availableHandymen.length} available handymen`,
      jobId: emergencyJob[0].id,
    });
  } catch (error) {
    console.error("Emergency alert error:", error);
    return NextResponse.json(
      { error: "Failed to send emergency alert" },
      { status: 500 }
    );
  }
}
