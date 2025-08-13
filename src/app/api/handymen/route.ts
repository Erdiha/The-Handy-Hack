import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, handymanProfiles, neighborhoods } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/security';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const neighborhood = searchParams.get('neighborhood');

    // Fetch all handymen with their profiles and neighborhoods
    const handymen = await db
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
      .where(eq(users.role, 'handyman'));

    // Transform data to match frontend interface
    const transformedHandymen = handymen.map((handyman, index) => ({
      id: handyman.id,
      name: handyman.name || 'Unknown',
      bio: handyman.bio || 'Local handyman ready to help with your projects.',
      hourlyRate: handyman.hourlyRate || '50',
      neighborhood: handyman.neighborhoodName || 'Unknown',
      services: ['General Repair', 'Maintenance'], // TODO: Get from services table when we build it
      isAvailable: true, // TODO: Implement real availability system
      distance: Math.round((Math.random() * 2 + 0.1) * 10) / 10, // Mock distance for now
      rating: Math.round((Math.random() * 0.5 + 4.5) * 10) / 10, // Mock rating for now
      reviewCount: Math.floor(Math.random() * 50) + 10, // Mock review count
      responseTime: ['15 min', '30 min', '1 hour'][index % 3], // Mock response time
      isVerified: handyman.isVerified || false,
      phone: handyman.phone,
    }));

    // Apply filters
    let filteredHandymen = transformedHandymen;

    if (service && service !== 'All Services') {
      filteredHandymen = filteredHandymen.filter(handyman =>
        handyman.services.some(s => s.toLowerCase().includes(service.toLowerCase()))
      );
    }

    if (availableOnly) {
      filteredHandymen = filteredHandymen.filter(handyman => handyman.isAvailable);
    }

    if (neighborhood) {
      filteredHandymen = filteredHandymen.filter(handyman =>
        handyman.neighborhood.toLowerCase().includes(neighborhood.toLowerCase())
      );
    }

    return NextResponse.json({
      handymen: filteredHandymen,
      total: filteredHandymen.length,
      success: true
    });

  } catch (error) {
    console.error('Error fetching handymen:', error);
    return NextResponse.json(
      { error: 'Failed to fetch handymen', success: false },
      { status: 500 }
    );
  }
})