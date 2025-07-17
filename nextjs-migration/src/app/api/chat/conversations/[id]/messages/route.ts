// API Route: /api/chat/conversations/[id]/messages
// Handles message retrieval for a specific conversation

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";
import { getMessagesByConversation } from "@/lib/chat-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("📨 Get messages endpoint called for conversation:", params.id);

    // Authenticate user
    const user = await authenticateRequest(request);

    // Validate conversation ID
    const conversationId = parseInt(params.id, 10);
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    // Get optional limit from query params
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
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

    console.log(
      "🔍 Getting messages for conversation:",
      conversationId,
      "limit:",
      limit
    );

    // Get messages
    const messages = await getMessagesByConversation(
      conversationId,
      user.id,
      limit
    );

    console.log("✅ Found messages:", messages.length);

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("❌ Error getting messages:", error);

    return NextResponse.json(
      { error: "Failed to retrieve messages" },
      { status: 500 }
    );
  }
}
