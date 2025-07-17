// API Route: /api/chat/conversations/[id]/send
// Handles sending messages to personas and getting AI responses

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";
import { sendMessage } from "@/lib/chat-service";
import { MessageCreateRequest } from "@/types/chat";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("💬 Send message endpoint called for conversation:", params.id);

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

    // Parse request body
    const body: MessageCreateRequest = await request.json();
    console.log("📝 Message content length:", body.content?.length || 0);

    // Validate required fields
    if (!body.content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    console.log("🚀 Sending message to conversation:", conversationId);

    // Send message and get AI response
    const chatResponse = await sendMessage(conversationId, user.id, {
      content: body.content,
    });

    console.log("✅ Chat response generated successfully");

    return NextResponse.json(chatResponse);
  } catch (error: any) {
    console.error("❌ Error sending message:", error);

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (
      error.message.includes("cannot be empty") ||
      error.message.includes("too long")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (
      error.message.includes("OpenAI") ||
      error.message.includes("AI response")
    ) {
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
