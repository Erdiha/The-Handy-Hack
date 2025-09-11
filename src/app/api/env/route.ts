// app/api/env/route.ts
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "OK" : "MISSING",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "OK" : "MISSING",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? "OK" : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "OK" : "MISSING",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "OK" : "MISSING",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "OK" : "MISSING",
    CLOUDINARY_URL: process.env.CLOUDINARY_URL ? "OK" : "MISSING",
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "OK" : "MISSING",
  });
}
