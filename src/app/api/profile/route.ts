import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, handymanProfiles, neighborhoods } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get user basic info
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For handymen: Check if handyman profile exists
    if (session.user.role === 'handyman') {
      const handymanProfile = await db
        .select({
          bio: handymanProfiles.bio,
          hourlyRate: handymanProfiles.hourlyRate,
          neighborhoodName: neighborhoods.name,
        })
        .from(handymanProfiles)
        .leftJoin(neighborhoods, eq(handymanProfiles.neighborhoodId, neighborhoods.id))
        .where(eq(handymanProfiles.userId, userId))
        .limit(1);

      if (handymanProfile[0]) {
        // Handyman has completed onboarding
        return NextResponse.json({
          hasCompletedOnboarding: true,
          phone: user[0].phone,
          bio: handymanProfile[0].bio,
          hourlyRate: handymanProfile[0].hourlyRate,
          neighborhood: handymanProfile[0].neighborhoodName,
          services: ['Plumbing', 'Electrical'],
        });
      } else {
        // Handyman needs onboarding
        return NextResponse.json({
          hasCompletedOnboarding: false,
          phone: user[0].phone,
        });
      }
    } else {
      // For customers: Check if they have phone (from onboarding)
      if (user[0].phone) {
        return NextResponse.json({
          hasCompletedOnboarding: true,
          phone: user[0].phone,
          neighborhood: 'Highland Park',
        });
      } else {
        return NextResponse.json({
          hasCompletedOnboarding: false,
          phone: null,
        });
      }
    }

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}