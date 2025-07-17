import { NextRequest, NextResponse } from "next/server";
import { socialMediaService } from "@/lib/social-media-service";

export async function GET(request: NextRequest) {
  try {
    const authUrls = {
      twitter: socialMediaService.generateTwitterAuthUrl(),
      facebook: socialMediaService.generateFacebookAuthUrl(),
    };

    return NextResponse.json(authUrls);
  } catch (error) {
    console.error("Failed to generate auth URLs:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication URLs" },
      { status: 500 }
    );
  }
}
