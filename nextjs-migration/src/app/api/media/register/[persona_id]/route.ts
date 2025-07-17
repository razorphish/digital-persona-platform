// API Route: /api/media/register/[persona_id]
// Handles registration of media files uploaded via presigned URLs

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";
import { createMediaFileFromS3 } from "@/lib/media-service";
import { getPersonaById } from "@/lib/personas";
import {
  S3UploadResult,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_EXTENSIONS,
} from "@/types/media";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: { persona_id: string } }
) {
  try {
    console.log(
      "📝 Register media file endpoint called for persona:",
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

    // Parse request body
    const body = await request.json();
    const {
      file_id,
      filename,
      original_filename,
      s3_key,
      file_size,
      mime_type,
      upload_method,
      description,
    } = body;

    // Validate required fields
    if (
      !file_id ||
      !filename ||
      !original_filename ||
      !s3_key ||
      !file_size ||
      !mime_type
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: file_id, filename, original_filename, s3_key, file_size, mime_type",
        },
        { status: 400 }
      );
    }

    // Verify persona exists and belongs to user
    const persona = await getPersonaById(personaId, user.id);
    if (!persona) {
      return NextResponse.json(
        { error: `Persona ${personaId} not found` },
        { status: 404 }
      );
    }

    // Validate file type
    if (
      !ALLOWED_IMAGE_TYPES.has(mime_type) &&
      !ALLOWED_VIDEO_TYPES.has(mime_type)
    ) {
      return NextResponse.json(
        { error: `Invalid MIME type. Only JPEG, PNG, and MP4 allowed.` },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileExt = path.extname(original_filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(fileExt)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed extensions: ${Array.from(
            ALLOWED_EXTENSIONS
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Determine media type
    let mediaType: string;
    if (ALLOWED_IMAGE_TYPES.has(mime_type)) {
      mediaType = "image";
    } else if (ALLOWED_VIDEO_TYPES.has(mime_type)) {
      mediaType = "video";
    } else {
      mediaType = "other";
    }

    // Create S3 result object
    const s3Result: S3UploadResult = {
      file_id,
      s3_key,
      bucket: process.env.AWS_S3_BUCKET || "digital-persona-platform",
      public_url: `https://${
        process.env.AWS_S3_BUCKET || "digital-persona-platform"
      }.s3.${process.env.AWS_REGION || "us-west-1"}.amazonaws.com/${s3_key}`,
      original_filename,
      mime_type,
      file_size,
      media_type: mediaType,
      user_id: user.id,
      persona_id: personaId,
      description,
      upload_method: upload_method || "presigned",
      status: "completed",
    };

    console.log(
      `📝 Registering media file: ${original_filename} (${file_size} bytes)`
    );

    // Register media file in database
    const mediaFile = await createMediaFileFromS3(
      user.id,
      s3Result,
      description
    );

    console.log("✅ Media file registered successfully:", mediaFile.id);

    return NextResponse.json(mediaFile, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error registering media file:", error);

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (
      error.message.includes("not allowed") ||
      error.message.includes("Invalid")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to register media file" },
      { status: 500 }
    );
  }
}
