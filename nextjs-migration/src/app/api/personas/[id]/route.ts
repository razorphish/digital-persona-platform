import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, handleApiError } from "@/lib/middleware";
import { getPersonaById, updatePersona, deletePersona } from "@/lib/personas";
import { validatePersonaCreate } from "@/types/personas";

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

    return NextResponse.json(persona);
  } catch (error: any) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse.body, {
      status: errorResponse.status,
    });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const updateData = validatePersonaCreate(body);

    // Update persona
    const updatedPersona = await updatePersona(personaId, user.id, updateData);

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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Delete persona
    const success = await deletePersona(personaId, user.id);

    if (!success) {
      return NextResponse.json(
        { detail: `Persona ${personaId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Persona ${personaId} deleted successfully`,
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
      "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
