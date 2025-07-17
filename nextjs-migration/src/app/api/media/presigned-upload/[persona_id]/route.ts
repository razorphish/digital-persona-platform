// API Route: /api/media/presigned-upload/[persona_id]
// Handles generation of presigned S3 upload URLs for direct browser uploads

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";
import { generatePresignedUploadUrl } from "@/lib/s3-service";
import { getPersonaById } from "@/lib/personas";
import {
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
      "🔗 Presigned upload URL endpoint called for persona:",
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
    const { filename, mime_type, expires_in } = body;

    if (!filename || !mime_type) {
      return NextResponse.json(
        { error: "filename and mime_type are required" },
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
    const fileExt = path.extname(filename).toLowerCase();
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

    console.log(
      `🔗 Generating presigned upload URL for: ${filename} (${mime_type})`
    );

    // Generate presigned upload URL
    const presignedData = await generatePresignedUploadUrl(
      user.id,
      personaId,
      filename,
      mime_type,
      expires_in || 3600 // Default 1 hour
    );

    console.log("✅ Presigned upload URL generated successfully");

    return NextResponse.json({
      upload_url: presignedData.upload_url,
      s3_key: presignedData.s3_key,
      file_id: presignedData.file_id,
      bucket: presignedData.bucket,
      expires_in: presignedData.expires_in,
      instructions: {
        method: "PUT",
        headers: {
          "Content-Type": mime_type,
        },
        note: "Upload the file directly to upload_url using PUT method with the file as the request body",
      },
    });
  } catch (error: any) {
    console.error("❌ Error generating presigned upload URL:", error);

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
      { error: "Failed to generate presigned upload URL" },
      { status: 500 }
    );
  }
}
