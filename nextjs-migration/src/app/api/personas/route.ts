import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, handleApiError } from "@/lib/middleware";
import { createPersona, getPersonasByUser } from "@/lib/personas";
import { validatePersonaCreate } from "@/types/personas";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);

    // Get all personas for the user
    const personas = await getPersonasByUser(user.id);

    return NextResponse.json(personas);
  } catch (error: any) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse.body, {
      status: errorResponse.status,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);

    // Parse and validate request body
    const body = await request.json();
    const personaData = validatePersonaCreate(body);

    // Create persona
    const persona = await createPersona(personaData, user.id);

    return NextResponse.json(persona, { status: 201 });
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
