import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  handymanProfiles,
  neighborhoods,
  handymanServices,
  customerProfiles, // Add this import
} from "@/lib/schema";
import { eq } from "drizzle-orm";
// Update the GET method:

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // ✅ Get user basic info FROM DATABASE (not session)
    const user = await db
      .select({
        id: users.id,
        name: users.name, //  Get fresh name from DB
        email: users.email, // Get fresh email from DB
        phone: users.phone,
      })
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
        // Get actual services from database
        const userServices = await db
          .select({
            serviceName: handymanServices.serviceName,
          })
          .from(handymanServices)
          .where(eq(handymanServices.handymanId, userId));

        const services =
          userServices.length > 0
            ? userServices.map((s) => s.serviceName)
            : ["Plumbing", "Electrical"];

        //  Return fresh data from database
        return NextResponse.json({
          success: true,
          hasCompletedOnboarding: true,
          name: user[0].name, //  Fresh from DB
          email: user[0].email, //  Fresh from DB
          phone: user[0].phone,
          bio: handymanProfile[0].bio,
          hourlyRate: handymanProfile[0].hourlyRate,
          isAvailable: handymanProfile[0].isAvailable ?? true,
          useScheduledAvailability:
            handymanProfile[0].useScheduledAvailability ?? false,
          neighborhood: handymanProfile[0].neighborhoodName,
          services: services,
        });
      } else {
        // Handyman needs onboarding
        return NextResponse.json({
          success: true,
          hasCompletedOnboarding: false,
          name: user[0].name, //  Fresh from DB
          email: user[0].email, // Fresh from DB
          phone: user[0].phone,
          isAvailable: true,
        });
      }
    } else {
      // For customers: Check if they have phone (from onboarding)
      if (user[0].phone) {
        return NextResponse.json({
          hasCompletedOnboarding: true,
          name: user[0].name, //  Fresh from DB
          email: user[0].email, //  Fresh from DB
          phone: user[0].phone,
          neighborhood: "Highland Park",
        });
      } else {
        return NextResponse.json({
          hasCompletedOnboarding: false,
          name: user[0].name, //  Fresh from DB
          email: user[0].email, //  Fresh from DB
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

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const updates = await request.json();

    // Update basic user info
    const { name, email, phone, bio, neighborhood } = updates;

    // Properly typed user update object
    const userUpdateData: {
      name?: string;
      email?: string;
      phone?: string;
    } = {};

    if (name !== undefined) userUpdateData.name = name;
    if (email !== undefined) userUpdateData.email = email;
    if (phone !== undefined) userUpdateData.phone = phone;

    if (Object.keys(userUpdateData).length > 0) {
      await db.update(users).set(userUpdateData).where(eq(users.id, userId));
    }

    // Handle role-specific updates
    if (session.user.role === "handyman") {
      // For handymen: update handymanProfiles
      if (bio !== undefined || neighborhood !== undefined) {
        const profileUpdateData: {
          bio?: string;
          neighborhoodId?: number;
          updatedAt: Date;
        } = {
          updatedAt: new Date(),
        };

        if (bio !== undefined) profileUpdateData.bio = bio;
        if (neighborhood !== undefined) {
          // neighborhood should be the ID for handymen
          const neighborhoodId = parseInt(neighborhood);
          if (!isNaN(neighborhoodId)) {
            profileUpdateData.neighborhoodId = neighborhoodId;
          }
        }

        await db
          .update(handymanProfiles)
          .set(profileUpdateData)
          .where(eq(handymanProfiles.userId, userId));
      }
    } else if (session.user.role === "customer") {
      // For customers: update customerProfiles
      if (neighborhood !== undefined) {
        // Check if customer profile exists
        const existingProfile = await db
          .select()
          .from(customerProfiles)
          .where(eq(customerProfiles.userId, userId))
          .limit(1);

        if (existingProfile[0]) {
          // Update existing profile
          await db
            .update(customerProfiles)
            .set({
              neighborhood: neighborhood, // Store as text for customers
              updatedAt: new Date(),
            })
            .where(eq(customerProfiles.userId, userId));
        } else {
          // Create new profile
          await db.insert(customerProfiles).values({
            userId: userId,
            neighborhood: neighborhood,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    const updatedUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      success: true,
      user: updatedUser[0],
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
