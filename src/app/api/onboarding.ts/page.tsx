import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, handymanProfiles, neighborhoods } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { neighborhood, address, phone, bio, services, hourlyRate } = body;

    // Update user phone
    await db.update(users)
      .set({ phone })
      .where(eq(users.id, parseInt(session.user.id)));

    // Find or create neighborhood
    let neighborhoodRecord = await db
      .select()
      .from(neighborhoods)
      .where(eq(neighborhoods.name, neighborhood))
      .limit(1);

    if (neighborhoodRecord.length === 0) {
      neighborhoodRecord = await db.insert(neighborhoods)
        .values({
          name: neighborhood,
          slug: neighborhood.toLowerCase().replace(/\s+/g, '-'),
          city: 'Los Angeles',
          state: 'CA'
        })
        .returning();
    }

    // If handyman, create profile
    if (session.user.role === 'handyman') {
      await db.insert(handymanProfiles)
        .values({
          userId: parseInt(session.user.id),
          bio,
          hourlyRate,
          neighborhoodId: neighborhoodRecord[0].id,
          isVerified: false
        });
    }

    return NextResponse.json(
      { message: 'Onboarding completed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}