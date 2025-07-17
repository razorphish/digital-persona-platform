// API Route: /api/chat/conversations/[id]
// Handles individual conversation management

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";
import { getConversationById } from "@/lib/chat-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 Get conversation endpoint called for ID:", params.id);

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

    // Get conversation
    const conversation = await getConversationById(conversationId, user.id);

    if (!conversation) {
      return NextResponse.json(
        { error: `Conversation ${conversationId} not found` },
        { status: 404 }
      );
    }

    console.log("✅ Found conversation:", conversation.title);

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error("❌ Error getting conversation:", error);

    return NextResponse.json(
      { error: "Failed to retrieve conversation" },
      { status: 500 }
    );
  }
}
