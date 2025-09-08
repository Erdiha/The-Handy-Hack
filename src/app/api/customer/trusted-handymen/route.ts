// src/app/api/customer/trusted-handymen/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      trustedHandymen: [],
    });
  } catch (error) {
    console.error("Trusted handymen error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
