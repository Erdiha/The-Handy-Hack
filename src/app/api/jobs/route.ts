import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, users } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq } from "drizzle-orm";

// POST - Create new job
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      urgency,
      budget,
      budgetAmount,
      location,
      photos,
    } = body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      !urgency ||
      !budget ||
      !location
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newJob = await db
      .insert(jobs)
      .values({
        title,
        description,
        category,
        urgency,
        budget,
        budgetAmount: budgetAmount ? budgetAmount.toString() : null,
        location,
        photos: JSON.stringify(photos || []),
        postedBy: parseInt(request.user!.id),
        status: "open",
      })
      .returning();

    return NextResponse.json({
      success: true,
      job: newJob[0],
      message: "Job posted successfully!",
    });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
});

// GET - Fetch all jobs with real customer names
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const urgency = searchParams.get("urgency");

    // Query jobs with real customer names
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
        customerName: users.name,
        photos: jobs.photos,
        acceptedBy: jobs.acceptedBy,
      })
      .from(jobs)
      .innerJoin(users, eq(jobs.postedBy, users.id));

    // Execute query
    const allJobs = await query;

    // Filter for open jobs only
    let filteredJobs = allJobs.filter(
      (job) => job.status === "open" && job.acceptedBy === null
    );

    if (category && category !== "All Categories") {
      filteredJobs = filteredJobs.filter((job) => job.category === category);
    }

    if (urgency && urgency !== "All") {
      filteredJobs = filteredJobs.filter((job) => job.urgency === urgency);
    }

    // Sort emergency jobs to the top
    filteredJobs.sort((a, b) => {
      if (a.urgency === "emergency" && b.urgency !== "emergency") return -1;
      if (b.urgency === "emergency" && a.urgency !== "emergency") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Transform jobs with real data
    const transformedJobs = filteredJobs.map((job) => {
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
        postedBy: job.customerName, // Real customer name
        customerId: job.postedBy.toString(),
        postedDate: postedDate,
        responses: 0, // Real response count (implement later)
        photos: [],
      };
    });

    return NextResponse.json({
      success: true,
      jobs: transformedJobs,
      total: transformedJobs.length,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
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
    return minutes <= 1 ? "1 minute ago" : `${minutes} minutes ago`;
  } else if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  } else {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }
}
