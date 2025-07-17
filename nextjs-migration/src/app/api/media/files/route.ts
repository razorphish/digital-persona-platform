// API Route: /api/media/files
// Handles listing media files for the authenticated user

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";
import { getMediaFilesByUser } from "@/lib/media-service";

export async function GET(request: NextRequest) {
  try {
    console.log("📁 List media files endpoint called");

    // Authenticate user
    const user = await authenticateRequest(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const personaIdParam = searchParams.get("persona_id");
    const mediaType = searchParams.get("media_type");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    let personaId: number | undefined;
    if (personaIdParam) {
      personaId = parseInt(personaIdParam, 10);
      if (isNaN(personaId)) {
        return NextResponse.json(
          { error: "Invalid persona_id parameter" },
          { status: 400 }
        );
      }
    }

    let limit: number | undefined;
    if (limitParam) {
      limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return NextResponse.json(
          { error: "Limit must be between 1 and 100" },
          { status: 400 }
        );
      }
    }

    let offset: number | undefined;
    if (offsetParam) {
      offset = parseInt(offsetParam, 10);
      if (isNaN(offset) || offset < 0) {
        return NextResponse.json(
          { error: "Offset must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    console.log(`🔍 Getting media files for user ${user.id}`, {
      personaId,
      mediaType,
      limit,
      offset,
    });

    // Get media files
    const mediaFiles = await getMediaFilesByUser(user.id, {
      persona_id: personaId,
      media_type: mediaType || undefined,
      limit,
      offset,
    });

    console.log(`✅ Found ${mediaFiles.length} media files`);

    return NextResponse.json({
      files: mediaFiles,
      count: mediaFiles.length,
      filters: {
        persona_id: personaId,
        media_type: mediaType,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error("❌ Error listing media files:", error);

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to retrieve media files" },
      { status: 500 }
    );
  }
}
