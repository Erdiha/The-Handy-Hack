// src/app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, and, gt } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      const baseUrl = getBaseUrl(request);
      return NextResponse.redirect(
        `${baseUrl}/auth/signin?error=invalid-token`
      );
    }

    // Find user with valid token
    const user = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.verificationToken, token),
          gt(users.verificationExpires, new Date())
        )
      )
      .limit(1);

    if (!user[0]) {
      const baseUrl = getBaseUrl(request);
      return NextResponse.redirect(
        `${baseUrl}/auth/signin?error=expired-token`
      );
    }

    // Mark user as verified
    await db
      .update(users)
      .set({
        isVerified: true,
        verificationToken: null,
        verificationExpires: null,
      })
      .where(eq(users.id, user[0].id));

    // Create response with success redirect
    const baseUrl = getBaseUrl(request);
    const response = NextResponse.redirect(
      `${baseUrl}/auth/signin?verified=true&email=${encodeURIComponent(
        user[0].email
      )}&signout=true`
    );

    // Clear any existing session cookies to force sign out
    response.cookies.set("next-auth.session-token", "", {
      expires: new Date(0),
      path: "/",
    });

    response.cookies.set("__Secure-next-auth.session-token", "", {
      expires: new Date(0),
      path: "/",
      secure: true,
    });

    // Clear any other NextAuth cookies
    response.cookies.set("next-auth.csrf-token", "", {
      expires: new Date(0),
      path: "/",
    });

    response.cookies.set("__Secure-next-auth.csrf-token", "", {
      expires: new Date(0),
      path: "/",
      secure: true,
    });

    return response;
  } catch (error) {
    console.error("Email verification error:", error);
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(
      `${baseUrl}/auth/signin?error=verification-failed`
    );
  }
}

// Dynamic base URL detection function
function getBaseUrl(request: Request): string {
  // Priority 1: Environment variable
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Priority 2: Public app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Priority 3: Detect from request headers
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") || url.protocol.slice(0, -1);

  if (host) {
    return `${protocol}://${host}`;
  }

  // Fallback
  return url.origin;
}
