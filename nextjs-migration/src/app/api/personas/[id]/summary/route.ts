import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, handleApiError } from "@/lib/middleware";
import { getPersonaById, generatePersonaSummary } from "@/lib/personas";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get persona
    const persona = await getPersonaById(personaId, user.id);

    if (!persona) {
      return NextResponse.json(
        { detail: `Persona ${personaId} not found` },
        { status: 404 }
      );
    }

    // Generate summary
    const summary = await generatePersonaSummary(persona);

    // Calculate age in days
    const createdDate = new Date(persona.created_at);
    const ageDays = Math.floor(
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      persona_id: personaId,
      summary,
      created_at: persona.created_at,
      age_days: ageDays,
      interaction_count: persona.interaction_count,
    });
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
