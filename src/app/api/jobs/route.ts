import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/lib/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/security';

// POST - Create new job
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
console.log("PHOTOS RECEIVED:", body.photos); // ADD THIS
const { title, description, category, urgency, budget, budgetAmount, location, photos } = body;

    // Validate required fields
    if (!title || !description || !category || !urgency || !budget || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

   const newJob = await db.insert(jobs).values({
  title,
  description,
  category,
  urgency,
  budget,
  budgetAmount: budgetAmount ? budgetAmount.toString() : null,
     location,
    photos: JSON.stringify(photos || []), // ADD THIS

  postedBy: parseInt(request.user!.id),
  status: 'open'
}).returning();
    return NextResponse.json({
      success: true,
      job: newJob[0],
      message: 'Job posted successfully!'
    });

  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
});

// GET - Fetch all jobs
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const urgency = searchParams.get('urgency');

    // Build query conditions
const query = db
  .select({
    id: jobs.id,
    title: jobs.title,
    description: jobs.description,
    category: jobs.category,
    urgency: jobs.urgency,
    budget: jobs.budget,
    budgetAmount: jobs.budgetAmount,
    location: jobs.location,
    status: jobs.status,
    createdAt: jobs.createdAt,
    postedBy: jobs.postedBy,
    photos: jobs.photos,
    acceptedBy: jobs.acceptedBy, // ADD THIS LINE
  })
  .from(jobs);

// Execute query
const allJobs = await query;

// Filter results (could be done in SQL for better performance)
let filteredJobs = allJobs.filter(
  (job) => job.status === "open" && job.acceptedBy === null
);
    
    if (category && category !== 'All Categories') {
      filteredJobs = filteredJobs.filter(job => job.category === category);
    }
    
    if (urgency && urgency !== 'All') {
      filteredJobs = filteredJobs.filter(job => job.urgency === urgency);
    }

    // In the transformedJobs mapping, add customer ID
const transformedJobs = filteredJobs.map((job, index) => {
  const mockNames = ['Sarah M.', 'Mike D.', 'Jennifer L.', 'David K.', 'Amanda R.', 'Carlos S.'];
  const postedDate = getRelativeTime(job.createdAt);
  
  return {
    id: job.id.toString(),
    title: job.title,
    description: job.description,
    category: job.category,
    location: job.location,
    budget: job.budget,
    budgetAmount: job.budgetAmount,
    urgency: job.urgency,
    postedBy: mockNames[index % mockNames.length],
    customerId: job.postedBy.toString(), // ADD THIS - real customer ID
    postedDate: postedDate,
    responses: Math.floor(Math.random() * 5),
    photos: []
  };
});

    return NextResponse.json({
      success: true,
      jobs: transformedJobs,
      total: transformedJobs.length
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
});

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return minutes <= 1 ? '1 minute ago' : `${minutes} minutes ago`;
  } else if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
}