// API Route: /api/chat/models
// Handles listing available OpenAI models

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";
import { listAvailableModels } from "@/lib/chat-service";

export async function GET(request: NextRequest) {
  try {
    console.log("🤖 List models endpoint called");

    // Authenticate user (optional - could be public, but keeping consistent)
    await authenticateRequest(request);

    // Get available models
    const modelsInfo = await listAvailableModels();

    console.log("✅ Models retrieved:", modelsInfo.total_models);

    return NextResponse.json(modelsInfo);
  } catch (error: any) {
    console.error("❌ Error listing models:", error);

    if (error.message.includes("not available")) {
      return NextResponse.json(
        { error: "OpenAI service is not available" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve available models" },
      { status: 500 }
    );
  }
}
