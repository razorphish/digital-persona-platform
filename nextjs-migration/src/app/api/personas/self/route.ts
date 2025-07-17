import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, handleApiError } from "@/lib/middleware";
import { getOrCreateSelfPersona } from "@/lib/personas";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);

    // Get or create self persona
    const selfPersona = await getOrCreateSelfPersona(user.id, user.full_name);

    return NextResponse.json(selfPersona);
  } catch (error: any) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse.body, {
      status: errorResponse.status,
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
