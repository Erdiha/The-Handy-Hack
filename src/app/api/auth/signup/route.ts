// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { sendEmail } from "@/lib/email";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user (unverified)
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      verificationToken,
      verificationExpires,
    });

    // Get dynamic base URL for verification link
    const baseUrl = getBaseUrl(request);
    const verificationUrl = `${baseUrl}/api/auth/verify?token=${verificationToken}`;

    // Send verification email
    await sendEmail(
      email,
      "Verify your TheHandyHack account",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef7ed;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ea580c; font-size: 28px; margin-bottom: 10px;">TheHandyHack</h1>
            <h2 style="color: #334155; font-size: 24px; margin: 0;">Welcome aboard!</h2>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; border: 1px solid #fed7aa;">
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hi ${name},
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Thanks for joining TheHandyHack! We're excited to have you in our community of trusted neighbors helping neighbors.
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              To get started, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); 
                        color: white; 
                        padding: 16px 32px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: 600; 
                        font-size: 16px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ✅ Verify Email Address
              </a>
            </div>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
                <strong>Can't click the button?</strong> Copy and paste this link into your browser:
              </p>
              <p style="word-break: break-all; color: #3b82f6; font-size: 14px; text-align: center; margin: 10px 0 0 0;">
                ${verificationUrl}
              </p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
                <strong>What happens next?</strong>
              </p>
              <ul style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Click the verification link above</li>
                <li>Complete your profile setup</li>
                <li>Start ${
                  role === "customer"
                    ? "finding trusted help"
                    : "offering your services"
                } in your neighborhood</li>
              </ul>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              This verification link expires in 24 hours for security.<br>
              If you didn't create an account with TheHandyHack, you can safely ignore this email.
            </p>
            
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
              Need help? Contact us at 
              <a href="mailto:support@thehandyhack.com" style="color: #ea580c; text-decoration: none;">
                support@thehandyhack.com
              </a>
            </p>
          </div>
        </div>
      `
    );

    return NextResponse.json(
      {
        message:
          "Account created successfully! Please check your email to verify your account before signing in.",
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create user. Please try again." },
      { status: 500 }
    );
  }
}

// Helper function to get dynamic base URL
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
