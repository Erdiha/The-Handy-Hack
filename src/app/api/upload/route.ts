// Replace your upload route with this:
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Get the file data
    const data = await request.arrayBuffer();
    const base64Data = Buffer.from(data).toString("base64");
    const dataURI = `data:image/jpeg;base64,${base64Data}`;

    // Clean filename
    const cleanFilename = filename
      .replace("job-photos/", "")
      .replace(/\.[^/.]+$/, "");

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      public_id: cleanFilename,
      folder: "job-photos",
      resource_type: "auto", // Handles images and other files
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      filename: cleanFilename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
