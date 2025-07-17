import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromToken } from "@/lib/auth";
import { socialMediaService } from "@/lib/social-media-service";
import { socialMediaIntegrationOperations } from "@/lib/database-memory";
import {
  ConnectSocialAccountRequest,
  validateIntegrationData,
} from "@/types/social-media";

export async function POST(request: NextRequest) {
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
    const body: ConnectSocialAccountRequest = await request.json();

    // Validate request data
    if (!validateIntegrationData(body)) {
      return NextResponse.json(
        {
          error:
            "Invalid request data. Platform and access_token are required.",
        },
        { status: 400 }
      );
    }

    // Check if integration already exists
    const existingIntegration =
      await socialMediaIntegrationOperations.findByUserAndPlatform(
        user.id,
        body.platform
      );

    if (existingIntegration) {
      return NextResponse.json(
        { error: `Account already connected for ${body.platform}` },
        { status: 400 }
      );
    }

    // Connect account based on platform
    let platformData;

    if (body.platform === "twitter") {
      if (!body.access_token_secret) {
        return NextResponse.json(
          {
            error: "Twitter requires both access_token and access_token_secret",
          },
          { status: 400 }
        );
      }

      platformData = await socialMediaService.connectTwitterAccount(
        body.access_token,
        body.access_token_secret
      );
    } else if (body.platform === "facebook") {
      platformData = await socialMediaService.connectFacebookAccount(
        body.access_token
      );
    } else {
      return NextResponse.json(
        { error: `Unsupported platform: ${body.platform}` },
        { status: 400 }
      );
    }

    // Create integration in database
    const integration = await socialMediaIntegrationOperations.create({
      user_id: user.id,
      platform: platformData.platform,
      platform_user_id: platformData.platform_user_id,
      platform_username: platformData.platform_username,
      access_token: platformData.access_token,
      access_token_secret: body.access_token_secret,
      refresh_token: body.refresh_token,
      is_active: true,
      sync_frequency_hours: 24,
      platform_metadata: platformData.platform_metadata,
    });

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error("Failed to connect social account:", error);
    return NextResponse.json(
      { error: "Failed to connect social media account" },
      { status: 500 }
    );
  }
}
