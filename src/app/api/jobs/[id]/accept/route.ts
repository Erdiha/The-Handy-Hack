import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/lib/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/security';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply auth manually
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jobId = parseInt(params.id);
    const handymanId = parseInt(session.user.id);

    // Check if job exists and is still open
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.status, 'open')))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or already taken' },
        { status: 404 }
      );
    }

    // Accept the job
    await db
      .update(jobs)
      .set({
        acceptedBy: handymanId,
        status: 'accepted'
      })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({
      success: true,
      message: 'Job accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting job:', error);
    return NextResponse.json(
      { error: 'Failed to accept job' },
      { status: 500 }
    );
  }
}