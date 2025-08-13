import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, handymanProfiles, neighborhoods } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const handymanId = parseInt(params.id);

    if (isNaN(handymanId)) {
      return NextResponse.json(
        { error: 'Invalid handyman ID' },
        { status: 400 }
      );
    }

    // Fetch handyman with profile and neighborhood data
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
      .leftJoin(neighborhoods, eq(handymanProfiles.neighborhoodId, neighborhoods.id))
      .where(eq(users.id, handymanId))
      .limit(1);

    if (!handyman[0]) {
      return NextResponse.json(
        { error: 'Handyman not found' },
        { status: 404 }
      );
    }

    // Transform data for frontend
    const profileData = {
      id: handyman[0].id,
      name: handyman[0].name,
      bio: handyman[0].bio || 'Experienced local handyman ready to help with your projects.',
      hourlyRate: handyman[0].hourlyRate || '50',
      neighborhood: handyman[0].neighborhoodName || 'Local Area',
      phone: handyman[0].phone,
      email: handyman[0].email,
      isVerified: handyman[0].isVerified || false,
      joinedDate: handyman[0].createdAt,

      // Mock data for now - we'll make these dynamic later
      services: [
        {
          name: 'General Repairs',
          description: 'Fixing things around the house, small repairs, maintenance',
          basePrice: handyman[0].hourlyRate || '50'
        },
        {
          name: 'Furniture Assembly',
          description: 'IKEA, Amazon purchases, custom furniture setup',
          basePrice: '45'
        },
        {
          name: 'Maintenance',
          description: 'Regular home maintenance, seasonal prep, inspections',
          basePrice: handyman[0].hourlyRate || '50'
        }
      ],

      availability: {
        isAvailable: true,
        responseTime: '15 minutes',
        workingHours: 'Mon-Sat: 8am-6pm',
        weekendAvailable: true
      },

      stats: {
        rating: 4.8,
        reviewCount: 42,
        completedJobs: 127,
        responseRate: '98%',
        onTimeRate: '95%'
      },

      // Mock reviews - we'll make these real later
      reviews: [
        {
          id: 1,
          customerName: 'Sarah M.',
          rating: 5,
          comment: 'Mike did an amazing job fixing our leaky faucet. Fast, professional, and reasonably priced!',
          date: '2 weeks ago',
          serviceType: 'Plumbing'
        },
        {
          id: 2,
          customerName: 'David L.',
          rating: 5,
          comment: 'Great work assembling our new dining room set. Would definitely hire again.',
          date: '1 month ago',
          serviceType: 'Furniture Assembly'
        },
        {
          id: 3,
          customerName: 'Maria G.',
          rating: 4,
          comment: 'Very reliable and knows his stuff. Fixed several issues around the house.',
          date: '2 months ago',
          serviceType: 'General Repairs'
        }
      ]
    };

    return NextResponse.json({
      handyman: profileData,
      success: true
    });

  } catch (error) {
    console.error('Error fetching handyman profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch handyman profile' },
      { status: 500 }
    );
  }
}