import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, handleApiError } from "@/lib/middleware";
import { addPersonaLearningData } from "@/lib/personas";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);

    // Parse persona ID
    const personaId = parseInt(params.id);
    if (isNaN(personaId)) {
      return NextResponse.json(
        { detail: "Invalid persona ID" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    if (!body.text || typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json(
        { detail: "Learning text is required and cannot be empty" },
        { status: 400 }
      );
    }

    // Add learning data to persona
    const updatedPersona = await addPersonaLearningData(
      personaId,
      user.id,
      body.text.trim()
    );

    if (!updatedPersona) {
      return NextResponse.json(
        { detail: `Persona ${personaId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPersona);
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
