import { EmailTemplate } from "@/components/EmailTemplate";
import { Resend } from "resend";
import { NextRequest } from "next/server";

// Only initialize Resend if the API key exists
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Resend is properly initialized
    if (!resend) {
      console.error("Resend API key not configured");
      return Response.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Parse the request body if you need dynamic data
    // const body = await request.json();
    // const { firstName, to, subject } = body;

    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: ["delivered@resend.dev"],
      subject: "Hello world",
      react: EmailTemplate({ firstName: "John" }),
    });

    if (error) {
      return Response.json(error, { status: 400 });
    }

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error("Email sending failed:", error);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }
}
