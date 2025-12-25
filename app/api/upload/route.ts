import { NextRequest, NextResponse } from 'next/server';
import { writeFile, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Check if a file exists at the given path
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Read file into buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Calculate MD5 hash
    const hash = crypto.createHash('md5').update(buffer).digest('hex');

    // Sanitize original filename
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Generate filename with hash: {hash}_{originalName}.pdf
    const fileName = `${hash}_${sanitizedOriginalName}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, fileName);

    // Check if file with this hash already exists
    const exists = await fileExists(filePath);

    if (exists) {
      // File already exists, return existing file info
      return NextResponse.json({
        success: true,
        data: {
          fileName,
          filePath: `/uploads/${fileName}`,
          fileSize: file.size,
          originalName: file.name,
          hash,
          fileReused: true,
          existingFilePath: `/uploads/${fileName}`,
        },
      });
    }

    // File doesn't exist, save it
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        filePath: `/uploads/${fileName}`,
        fileSize: file.size,
        originalName: file.name,
        hash,
        fileReused: false,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}
