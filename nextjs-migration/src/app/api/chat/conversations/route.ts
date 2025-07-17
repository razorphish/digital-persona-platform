// API Route: /api/chat/conversations
// Handles conversation creation and listing

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";
import { createConversation, getConversationsByUser } from "@/lib/chat-service";
import { ConversationCreateRequest } from "@/types/chat";

export async function POST(request: NextRequest) {
  try {
    console.log("🆕 Create conversation endpoint called");

    // Authenticate user
    const user = await authenticateRequest(request);

    // Parse request body
    const body: ConversationCreateRequest = await request.json();
    console.log("📝 Request body:", body);

    // Validate required fields
    if (!body.title || !body.persona_id) {
      return NextResponse.json(
        { error: "Title and persona_id are required" },
        { status: 400 }
      );
    }

    // Create conversation
    const conversation = await createConversation(user.id, {
      title: body.title,
      persona_id: body.persona_id,
    });

    console.log("✅ Conversation created:", conversation);

    return NextResponse.json(conversation, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error creating conversation:", error);

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.message.includes("cannot be empty")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create conversation", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("📋 List conversations endpoint called");

    // Authenticate user
    const user = await authenticateRequest(request);

    // Get optional persona_id from query params
    const { searchParams } = new URL(request.url);
    const personaIdParam = searchParams.get("persona_id");
    const personaId = personaIdParam ? parseInt(personaIdParam, 10) : undefined;

    console.log(
      "🔍 Getting conversations for user:",
      user.id,
      "persona:",
      personaId
    );

    // Get conversations
    const conversations = await getConversationsByUser(user.id, personaId);

    console.log("✅ Found conversations:", conversations.length);

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error("❌ Error listing conversations:", error);

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to retrieve conversations" },
      { status: 500 }
    );
  }
}
