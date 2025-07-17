// API Route: /api/media/upload/[persona_id]
// Handles media file uploads for specific personas

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";
import { createMediaFile } from "@/lib/media-service";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE,
} from "@/types/media";

export async function POST(
  request: NextRequest,
  { params }: { params: { persona_id: string } }
) {
  try {
    console.log(
      "📁 Media upload endpoint called for persona:",
      params.persona_id
    );

    // Authenticate user
    const user = await authenticateRequest(request);

    // Validate persona ID
    const personaId = parseInt(params.persona_id, 10);
    if (isNaN(personaId)) {
      return NextResponse.json(
        { error: "Invalid persona ID" },
        { status: 400 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size ${file.size} exceeds maximum ${MAX_FILE_SIZE} bytes`,
        },
        { status: 400 }
      );
    }

    // Validate file type
    const mimeType = file.type;
    if (
      !ALLOWED_IMAGE_TYPES.has(mimeType) &&
      !ALLOWED_VIDEO_TYPES.has(mimeType)
    ) {
      return NextResponse.json(
        {
          error: `File type ${mimeType} not allowed. Allowed types: JPEG, PNG, MP4`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    console.log(
      `📤 Uploading file: ${file.name} (${file.size} bytes, ${mimeType})`
    );

    // Create media file (uploads to S3 and saves to database)
    const mediaFile = await createMediaFile(
      user.id,
      personaId,
      fileBuffer,
      file.name,
      mimeType,
      description || undefined
    );

    console.log("✅ Media file created successfully:", mediaFile.id);

    return NextResponse.json(mediaFile, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error uploading media file:", error);

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (
      error.message.includes("not allowed") ||
      error.message.includes("exceeds maximum")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to upload media file" },
      { status: 500 }
    );
  }
}
