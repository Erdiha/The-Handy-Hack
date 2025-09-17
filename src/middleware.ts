import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Check if it's a protected route
  const protectedPaths = ["/dashboard", "/messages", "/settings", "/admin"];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for session token in cookies
  const token =
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
