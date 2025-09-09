import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, jobs } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const userPayments = await db
      .select({
        id: payments.id,
        amount: payments.totalCharged,
        status: payments.status,
        createdAt: payments.createdAt,
        jobTitle: jobs.title,
      })
      .from(payments)
      .leftJoin(jobs, eq(payments.jobId, jobs.id))
      .where(
        session.user.role === "customer"
          ? eq(payments.customerId, userId)
          : eq(payments.handymanId, userId)
      )
      .orderBy(desc(payments.createdAt))
      .limit(20);

    return NextResponse.json({
      success: true,
      payments: userPayments.map((p) => ({
        ...p,
        date: p.createdAt,
        amount: session.user.role === "customer" ? p.amount : p.amount * 0.9, // 90% for handyman
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}
