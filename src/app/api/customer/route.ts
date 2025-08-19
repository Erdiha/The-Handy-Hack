// app/api/customer/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/lib/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/security';
import { eq, and, gte, sql } from 'drizzle-orm';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Total jobs posted
    const [totalJobs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(eq(jobs.postedBy, userId));

    // This month spending
    const [monthlySpending] = await db
      .select({ amount: sql<number>`coalesce(sum(cast(budget_amount as decimal)), 0)` })
      .from(jobs)
      .where(
        and(
          eq(jobs.postedBy, userId),
          eq(jobs.status, 'completed'),
          gte(jobs.createdAt, thisMonth)
        )
      );

    const totalJobCount = totalJobs.count;
    const thisMonthSpending = Math.round(monthlySpending.amount || 0);
    const estimatedSavings = Math.round(thisMonthSpending * 0.18);

    return NextResponse.json({
      success: true,
      stats: {
        totalJobs: totalJobCount,
        thisMonthSpending,
        estimatedSavings,
      }
    });

  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
});