import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Get the file data
    const data = await request.arrayBuffer();
    const bytes = new Uint8Array(data);

    // Create uploads directory path
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Clean filename and create full path
    const cleanFilename = filename.replace('job-photos/', '');
    const filePath = path.join(uploadsDir, cleanFilename);

    // Write file
    await writeFile(filePath, bytes);

    // Return public URL
    const publicUrl = `/uploads/${cleanFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: cleanFilename
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}