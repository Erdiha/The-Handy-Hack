import { EmailTemplate } from "@/components/EmailTemplate";
import { Resend } from "resend";
import { NextRequest } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
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
