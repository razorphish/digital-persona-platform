import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromToken } from "@/lib/auth";
import { socialMediaIntegrationOperations } from "@/lib/database-memory";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await getCurrentUserFromToken(token);

    // Get all integrations for the user
    const integrations = await socialMediaIntegrationOperations.findByUserId(
      user.id
    );

    return NextResponse.json(integrations);
  } catch (error) {
    console.error("Failed to fetch integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}
