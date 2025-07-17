// API Route: /api/media/files/[id]
// Handles individual media file operations (GET, DELETE)

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";
import {
  getMediaFileById,
  deleteMediaFile,
  getDownloadUrl,
} from "@/lib/media-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("📁 Get media file endpoint called for ID:", params.id);

    // Authenticate user
    const user = await authenticateRequest(request);

    // Validate media file ID
    const mediaId = parseInt(params.id, 10);
    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: "Invalid media file ID" },
        { status: 400 }
      );
    }

    // Get media file
    const mediaFile = await getMediaFileById(mediaId, user.id);

    if (!mediaFile) {
      return NextResponse.json(
        { error: `Media file ${mediaId} not found` },
        { status: 404 }
      );
    }

    console.log(`✅ Retrieved media file: ${mediaFile.original_filename}`);

    return NextResponse.json(mediaFile);
  } catch (error: any) {
    console.error("❌ Error getting media file:", error);

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to retrieve media file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🗑️ Delete media file endpoint called for ID:", params.id);

    // Authenticate user
    const user = await authenticateRequest(request);

    // Validate media file ID
    const mediaId = parseInt(params.id, 10);
    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: "Invalid media file ID" },
        { status: 400 }
      );
    }

    // Delete media file
    const deleted = await deleteMediaFile(mediaId, user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: `Failed to delete media file ${mediaId}` },
        { status: 404 }
      );
    }

    console.log(`✅ Deleted media file ID: ${mediaId}`);

    return NextResponse.json(
      { message: "Media file deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error deleting media file:", error);

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete media file" },
      { status: 500 }
    );
  }
}
