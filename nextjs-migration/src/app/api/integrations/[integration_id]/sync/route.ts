import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromToken } from "@/lib/auth";
import {
  socialMediaIntegrationOperations,
  socialMediaPostOperations,
  integrationAnalyticsOperations,
} from "@/lib/database-memory";
import { socialMediaService } from "@/lib/social-media-service";
import { SyncRequest } from "@/types/social-media";

export async function POST(
  request: NextRequest,
  { params }: { params: { integration_id: string } }
) {
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

    const integrationId = parseInt(params.integration_id);
    if (isNaN(integrationId)) {
      return NextResponse.json(
        { error: "Invalid integration ID" },
        { status: 400 }
      );
    }

    // Get and verify integration ownership
    const integration = await socialMediaIntegrationOperations.findById(
      integrationId
    );
    if (!integration || integration.user_id !== user.id) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    const body: SyncRequest = await request.json().catch(() => ({}));

    // Sync posts based on platform
    let postsData;
    try {
      if (integration.platform === "twitter") {
        postsData = await socialMediaService.syncTwitterPosts(
          integration.id,
          integration.access_token,
          body.force_full_sync ? undefined : undefined // Could use last sync ID
        );
      } else if (integration.platform === "facebook") {
        postsData = await socialMediaService.syncFacebookPosts(
          integration.id,
          integration.access_token,
          body.force_full_sync
            ? undefined
            : integration.last_sync_at
            ? new Date(integration.last_sync_at)
            : undefined
        );
      } else {
        return NextResponse.json(
          { error: `Unsupported platform: ${integration.platform}` },
          { status: 400 }
        );
      }
    } catch (syncError) {
      console.error("Sync error:", syncError);
      return NextResponse.json(
        { error: "Failed to sync posts from platform" },
        { status: 500 }
      );
    }

    // Filter out posts that already exist
    const newPosts = [];
    for (const postData of postsData) {
      const existing = await socialMediaPostOperations.findByPlatformPostId(
        integration.id,
        postData.platform_post_id
      );
      if (!existing) {
        newPosts.push(postData);
      }
    }

    // Bulk create new posts
    let createdPosts: any[] = [];
    if (newPosts.length > 0) {
      createdPosts = await socialMediaPostOperations.bulkCreate(newPosts);
    }

    // Update last sync time
    await socialMediaIntegrationOperations.update(integration.id, {
      last_sync_at: new Date().toISOString(),
    });

    // Calculate analytics for new posts
    if (newPosts.length > 0) {
      try {
        const analyticsData = await socialMediaService.calculateAnalytics(
          createdPosts
        );
        await integrationAnalyticsOperations.create({
          integration_id: integration.id,
          date: new Date().toISOString().split("T")[0], // Today's date
          ...analyticsData,
        });
      } catch (analyticsError) {
        console.warn("Failed to calculate analytics:", analyticsError);
      }
    }

    // Automatically learn from new social media posts and update self persona
    let learningResults = {};
    if (newPosts.length > 0) {
      try {
        // Get or create self persona
        const selfPersona = await personaOperations.getOrCreateSelfPersona(
          user.id
        );

        if (selfPersona && selfPersona.learning_enabled) {
          // Create learning data from posts
          const learningData = socialMediaService.createLearningDataFromPosts(
            createdPosts,
            integration.platform
          );

          // Update persona's memory context
          const currentContext = selfPersona.memory_context || "";
          const newContext = currentContext
            ? `${currentContext}\n\n[Social Media Learning - ${
                new Date().toISOString().split("T")[0]
              }]\n${learningData.text}`
            : `[Social Media Learning - ${
                new Date().toISOString().split("T")[0]
              }]\n${learningData.text}`;

          await personaOperations.updatePersonaLearning(
            selfPersona.id,
            newContext,
            selfPersona.interaction_count + 1
          );

          learningResults = {
            updated_personas: [selfPersona.id],
            learning_count: 1,
            total_posts_processed: newPosts.length,
          };
        } else {
          learningResults = {
            updated_personas: [],
            learning_count: 0,
            total_posts_processed: newPosts.length,
            error: "Self persona not found or learning disabled",
          };
        }
      } catch (learningError) {
        console.error(
          "Failed to learn from social media posts:",
          learningError
        );
        learningResults = {
          updated_personas: [],
          learning_count: 0,
          total_posts_processed: newPosts.length,
          error: `Learning failed: ${learningError}`,
        };
      }
    }

    return NextResponse.json({
      message: "Sync completed successfully",
      new_posts_count: createdPosts.length,
      total_posts_synced: postsData.length,
      learning_results: learningResults,
    });
  } catch (error) {
    console.error("Failed to sync integration:", error);
    return NextResponse.json(
      { error: "Failed to sync integration" },
      { status: 500 }
    );
  }
}
