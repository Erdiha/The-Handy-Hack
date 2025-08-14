import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq, and, like } from 'drizzle-orm';

// GET - Fetch handymen
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const availableOnly = searchParams.get('availableOnly') === 'true';

    console.log('Fetching handymen with filters:', { service, availableOnly });

    // Fetch all handymen (users with role 'handyman')
    const handymenQuery = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        // Add other fields you need from your users table
      })
      .from(users)
      .where(eq(users.role, 'handyman'));

    const handymenFromDB = await handymenQuery;

    console.log(`Found ${handymenFromDB.length} handymen in database`);

    // Transform the data to match your frontend expectations
    const transformedHandymen = handymenFromDB.map((handyman, index) => {
      // Mock data - replace with real data from your database
      const mockServices = [
        ['Plumbing', 'Electrical'],
        ['Painting', 'Carpentry'],
        ['Appliance Repair', 'Furniture Assembly'],
        ['Home Cleaning', 'Landscaping'],
        ['Tile Work', 'Drywall Repair'],
        ['General Repair', 'Plumbing'],
      ];

      const mockLocations = ['Highland Park', 'Downtown', 'Uptown', 'Midtown', 'Riverside'];
      const mockBios = [
        'Experienced handyman with 10+ years serving the community. Quality work guaranteed!',
        'Local contractor specializing in home repairs and improvements. Licensed and insured.',
        'Fast, reliable service for all your home maintenance needs. Available weekends!',
        'Professional handyman with expertise in multiple trades. Fair pricing, honest work.',
      ];

      return {
        id: handyman.id.toString(), // Ensure this is the actual user ID
        name: handyman.name,
        bio: mockBios[index % mockBios.length],
        services: mockServices[index % mockServices.length],
        hourlyRate: 45 + (index * 5), // Mock rates
        rating: 4.2 + (Math.random() * 0.8), // Mock ratings
        reviewCount: 15 + (index * 3),
        distance: 0.5 + (Math.random() * 3),
        neighborhood: mockLocations[index % mockLocations.length],
        responseTime: index % 2 === 0 ? '30 minutes' : '1 hour',
        isAvailable: availableOnly ? true : Math.random() > 0.3, // Mock availability
      };
    });

    // Apply filters
    let filteredHandymen = transformedHandymen;

    if (service && service !== 'All Services') {
      filteredHandymen = filteredHandymen.filter(handyman =>
        handyman.services.includes(service)
      );
    }

    if (availableOnly) {
      filteredHandymen = filteredHandymen.filter(handyman => handyman.isAvailable);
    }

    console.log(`Returning ${filteredHandymen.length} filtered handymen`);

    return NextResponse.json({
      success: true,
      handymen: filteredHandymen,
      total: filteredHandymen.length
    });

  } catch (error) {
    console.error('Error fetching handymen:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch handymen',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create handyman profile (optional)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, bio, services, hourlyRate } = body;

    // Add logic to create/update handyman profile
    // This would typically update additional profile fields in your users table
    // or create records in a separate handyman_profiles table

    return NextResponse.json({
      success: true,
      message: 'Handyman profile updated'
    });

  } catch (error) {
    console.error('Error updating handyman profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}