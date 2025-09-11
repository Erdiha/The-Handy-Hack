import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportTickets } from "@/lib/schema";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { problemType, description, priority } = await request.json();

    if (!problemType || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await db.insert(supportTickets).values({
      jobId: null, // No job for Help Center tickets
      jobTitle: "Help Center Request",
      customerEmail: session.user.email!,
      handymanName: null,
      problemType: `Help: ${problemType}`, // Prefix to distinguish
      description,
      status: "open",
      priority: priority || "normal",
      reportedBy: Number(session.user.id),
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Help ticket submitted",
    });
  } catch (error) {
    console.error("Help Center ticket error:", error);
    return NextResponse.json(
      { error: "Failed to submit help ticket" },
      { status: 500 }
    );
  }
}
