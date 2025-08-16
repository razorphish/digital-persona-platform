import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  users,
  personas,
  userFollows,
  personaLikes,
  userConnections,
  feedItems,
  discoveryMetrics,
  personaReviews,
} from "@digital-persona/database";
import { db } from "@digital-persona/database";
import { eq, and, sql, inArray } from "drizzle-orm";
import { PersonaService } from "../services/personaService.js";
import { FeedAlgorithmService } from "../services/feedAlgorithmService.js";

type CreatedUser = {
  id: string;
  email: string;
  name: string;
  password: string;
};

// Simple data pools to avoid adding external faker dependency
const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Casey",
  "Riley",
  "Morgan",
  "Drew",
  "Quinn",
  "Avery",
  "Hayden",
  "Cameron",
  "Charlie",
  "Dakota",
  "Elliot",
  "Emerson",
  "Finley",
  "Harper",
  "Justice",
  "Kendall",
  "Logan",
  "Parker",
  "Reese",
  "Rowan",
  "Sage",
  "Skyler",
  "Sydney",
  "Tatum",
  "Teagan",
  "Wren",
  "Zion",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Miller",
  "Davis",
  "Garcia",
  "Rodriguez",
  "Wilson",
  "Martinez",
  "Anderson",
  "Taylor",
  "Thomas",
  "Hernandez",
  "Moore",
  "Martin",
  "Jackson",
  "Thompson",
  "White",
  "Lopez",
  "Lee",
  "Gonzalez",
  "Harris",
  "Clark",
];

const LOCATIONS = [
  "San Francisco, CA",
  "New York, NY",
  "Austin, TX",
  "Seattle, WA",
  "Miami, FL",
  "Los Angeles, CA",
  "Chicago, IL",
  "Denver, CO",
  "Boston, MA",
  "Portland, OR",
];

const PERSONA_CATEGORIES = [
  "entertainment",
  "education",
  "lifestyle",
  "business",
  "gaming",
  "art",
  "music",
  "fitness",
  "cooking",
  "technology",
  "general",
] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function makeName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function makeEmail(index: number, domain = "seed.local"): string {
  const num = String(index).padStart(3, "0");
  return `user${num}@${domain}`.toLowerCase();
}

function makePassword(index: number): string {
  // Strong but predictable so we can list them
  return `Passw0rd!${String(index).padStart(3, "0")}`;
}

async function ensureEnv() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set to run seeding");
  }
}

async function createUsers(
  count: number,
  emailDomain: string
): Promise<CreatedUser[]> {
  const created: CreatedUser[] = [];

  for (let i = 1; i <= count; i++) {
    const email = makeEmail(i, emailDomain);
    const name = makeName();
    const password = makePassword(i);
    const passwordHash = await bcrypt.hash(password, 12);

    // Skip if exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing[0]) {
      created.push({ id: existing[0].id, email, name, password });
      continue;
    }

    const [row] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        isActive: true,
        allowSocialConnections: true,
        defaultPrivacyLevel: "friends",
        location: pick(LOCATIONS),
        bio: `Hi, I'm ${name}. I love ${pick(PERSONA_CATEGORIES)} and ${pick(
          PERSONA_CATEGORIES
        )}.`,
      })
      .returning({ id: users.id });

    created.push({ id: row.id, email, name, password });
  }

  return created;
}

async function createPersonas(usersCreated: CreatedUser[]) {
  // Ensure each user has a main persona (raw insert to avoid schema column drift like 'category')
  for (const u of usersCreated) {
    try {
      const traits = {
        personaType: "main",
        isMainPersona: true,
        isDeletable: false,
        learningEnabled: true,
        allowConnections: false,
        contentFilter: {
          allowExplicit: false,
          allowPersonalInfo: true,
          allowSecrets: true,
          allowPhotos: true,
          allowVideos: true,
          customRules: [],
        },
        guardRails: {
          allowedUsers: [u.id],
          blockedUsers: [],
          allowedTopics: [],
          blockedTopics: [],
          maxInteractionDepth: 100,
        },
      };
      const preferences = {
        privacyLevel: "private",
        isPubliclyListed: false,
        requiresSubscription: false,
      };

      // Insert only columns that exist in current DB migration
      await db.execute(sql`
        insert into personas (
          user_id,
          name,
          description,
          avatar,
          persona_type,
          is_main_persona,
          parent_persona_id,
          traits,
          preferences,
          memory_context,
          personality_profile,
          privacy_level,
          content_filter,
          guard_rails,
          is_publicly_listed,
          allow_connections,
          requires_subscription,
          learning_enabled,
          interaction_count,
          last_interaction,
          is_default,
          is_active,
          is_deletable
        ) values (
          ${u.id},
          ${`${u.name}'s Digital Mind`},
          ${"Your primary digital persona - the core that learns and grows with you."},
          ${null},
          ${"child"},
          ${false},
          ${null},
          ${JSON.stringify(traits)}::jsonb,
          ${JSON.stringify(preferences)}::jsonb,
          ${null},
          ${null},
          ${"friends"},
          ${null},
          ${null},
          ${false},
          ${false},
          ${false},
          ${true},
          ${0},
          ${null},
          ${true},
          ${true},
          ${false}
        )
        on conflict do nothing
      `);
    } catch (e) {
      console.warn(`Skipping main persona creation for ${u.email}:`, e);
    }
  }

  // Create public personas for a subset to populate feeds
  for (const u of usersCreated) {
    const numPublic =
      Math.random() < 0.6 ? 1 + Math.floor(Math.random() * 2) : 0; // 0-2 public personas for ~60% users
    if (numPublic === 0) continue;

    // Get user's main persona for inheritance
    const [main] = await db
      .select({ id: personas.id })
      .from(personas)
      .where(and(eq(personas.userId, u.id), eq(personas.isDefault, true)))
      .limit(1);

    for (let k = 0; k < numPublic; k++) {
      const category = pick(PERSONA_CATEGORIES);
      const personaName = `${u.name.split(" ")[0]}'s ${
        category[0].toUpperCase() + category.slice(1)
      } Persona`;
      const traits = {
        personaType: "public",
        interests: [pick(PERSONA_CATEGORIES), pick(PERSONA_CATEGORIES)],
      };
      const preferences = {
        privacyLevel: "public",
        isPubliclyListed: true,
        allowConnections: true,
      };

      await db.execute(sql`
        insert into personas (
          user_id,
          name,
          description,
          avatar,
          persona_type,
          is_main_persona,
          parent_persona_id,
          traits,
          preferences,
          memory_context,
          personality_profile,
          privacy_level,
          content_filter,
          guard_rails,
          is_publicly_listed,
          allow_connections,
          requires_subscription,
          learning_enabled,
          interaction_count,
          last_interaction,
          is_default,
          is_active,
          is_deletable
        ) values (
          ${u.id},
          ${personaName},
          ${`Public ${category} persona by ${u.name}.`},
          ${null},
          ${"public"},
          ${false},
          ${main?.id ?? null},
          ${JSON.stringify(traits)}::jsonb,
          ${JSON.stringify(preferences)}::jsonb,
          ${null},
          ${null},
          ${"public"},
          ${null},
          ${null},
          ${true},
          ${true},
          ${false},
          ${true},
          ${0},
          ${null},
          ${false},
          ${true},
          ${true}
        )
      `);
    }
  }
}

type FollowReason =
  | "creator_interest"
  | "persona_discovery"
  | "friend_connection"
  | "recommendation";

const FOLLOW_REASONS = [
  "creator_interest",
  "persona_discovery",
  "friend_connection",
  "recommendation",
] as const satisfies Readonly<FollowReason[]>;

async function createFollows(usersCreated: CreatedUser[]) {
  // For each user, follow 10-25 other random users
  const userIds = usersCreated.map((u) => u.id);
  for (const u of usersCreated) {
    const numFollows = 10 + Math.floor(Math.random() * 16);
    const candidates = shuffle(userIds.filter((id) => id !== u.id)).slice(
      0,
      numFollows
    );
    if (candidates.length === 0) continue;

    const rows = candidates.map((targetId) => ({
      followerId: u.id,
      followingId: targetId,
      followReason: pick(FOLLOW_REASONS),
      notifyOnNewPersona: true,
      notifyOnUpdates: Math.random() < 0.25,
    }));

    await db.insert(userFollows).values(rows);
  }
}

type LikeType = "like" | "favorite" | "bookmark" | "interested";
const LIKE_TYPES = [
  "like",
  "favorite",
  "bookmark",
  "interested",
] as const satisfies Readonly<LikeType[]>;

type DiscoveredVia =
  | "feed"
  | "search"
  | "trending"
  | "recommendation"
  | "creator_profile"
  | "direct_link";
const DISCOVERED_VIA = [
  "feed",
  "search",
  "trending",
  "recommendation",
  "creator_profile",
  "direct_link",
] as const satisfies Readonly<DiscoveredVia[]>;

async function createLikes(usersCreated: CreatedUser[]) {
  // Collect all public personas
  const publicPersonas = await db
    .select({ id: personas.id, userId: personas.userId })
    .from(personas)
    .where(eq(personas.privacyLevel, "public"));

  const personaIds = publicPersonas.map((p) => p.id);
  if (personaIds.length === 0) return;

  for (const u of usersCreated) {
    const numLikes = 5 + Math.floor(Math.random() * 10);
    const liked = shuffle(personaIds).slice(0, numLikes);
    const rows = liked.map((pid) => ({
      userId: u.id,
      personaId: pid,
      likeType: pick(LIKE_TYPES),
      discoveredVia: pick(DISCOVERED_VIA),
    }));
    await db.insert(personaLikes).values(rows);
  }
}

type ConnectionType = "friend" | "follower" | "subscriber" | "blocked";
type ConnectionStatus = "pending" | "accepted" | "declined" | "blocked";
const CONNECTION_TYPES = [
  "friend",
  "follower",
  "subscriber",
  "blocked",
] as const;
const CONNECTION_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "blocked",
] as const;

async function createPersonaFollowers(usersCreated: CreatedUser[]) {
  // Build persona-level follower connections in user_connections
  const publicPersonas = await db
    .select({ id: personas.id, userId: personas.userId })
    .from(personas)
    .where(eq(personas.privacyLevel, "public"));

  if (publicPersonas.length === 0) return;

  const userIds = usersCreated.map((u) => u.id);
  for (const p of publicPersonas) {
    // 20-80 followers per public persona
    const followersCount = 20 + Math.floor(Math.random() * 61);
    const candidates = shuffle(userIds.filter((id) => id !== p.userId)).slice(
      0,
      followersCount
    );

    if (candidates.length === 0) continue;

    const rows = candidates.map((followerId) => ({
      requesterId: followerId,
      targetPersonaId: p.id,
      targetUserId: p.userId,
      connectionType: "follower" as ConnectionType,
      status: "accepted" as ConnectionStatus,
      accessLevel: "basic" as const,
      retainHistoricalData: true,
    }));

    await db.insert(userConnections).values(rows);
  }
}

async function ensureFirst100PersonaFollowing(usersCreated: CreatedUser[]) {
  // Deterministically ensure first 100 users are following personas
  const sorted = [...usersCreated].sort((a, b) =>
    a.email.localeCompare(b.email)
  );
  const first100 = sorted.slice(0, 100);

  // Fetch all public personas once
  const publicPersonas = await db
    .select({ id: personas.id, userId: personas.userId })
    .from(personas)
    .where(eq(personas.isPublic, true));

  if (publicPersonas.length === 0) return;

  for (const u of first100) {
    // Pick 12 personas not owned by this user
    const candidates = shuffle(
      publicPersonas.filter((p) => p.userId !== u.id).map((p) => p.id)
    ).slice(0, 12);

    if (candidates.length === 0) continue;

    // Check existing to avoid duplicates
    // Get existing connections by this requester to any of these personas
    const existing = await db
      .select({ targetPersonaId: userConnections.targetPersonaId })
      .from(userConnections)
      .where(and(eq(userConnections.requesterId, u.id)));
    const existingSet = new Set(existing.map((e) => e.targetPersonaId));

    const rows = candidates
      .filter((pid) => !existingSet.has(pid))
      .map((pid) => ({
        requesterId: u.id,
        targetPersonaId: pid,
        // Find the persona owner's user id
        targetUserId:
          publicPersonas.find((pp) => pp.id === pid)?.userId || u.id,
        connectionType: "follower" as ConnectionType,
        status: "accepted" as ConnectionStatus,
        accessLevel: "basic" as const,
        retainHistoricalData: true,
      }));

    if (rows.length > 0) {
      await db.insert(userConnections).values(rows);
    }
  }
}

async function ensureFirst100PersonaFollowers(usersCreated: CreatedUser[]) {
  // Ensure personas owned by first 100 users have followers
  const sorted = [...usersCreated].sort((a, b) =>
    a.email.localeCompare(b.email)
  );
  const first100 = sorted.slice(0, 100);
  const otherUsers = usersCreated.filter((u) => !first100.includes(u));

  for (const u of first100) {
    // Get public personas for this user
    const myPublicPersonas = await db
      .select({ id: personas.id })
      .from(personas)
      .where(and(eq(personas.userId, u.id), eq(personas.isPublic, true)));

    if (myPublicPersonas.length === 0) continue;

    const followerPool = otherUsers.length > 0 ? otherUsers : usersCreated;
    const followerIds = shuffle(followerPool.map((x) => x.id)).slice(0, 30);

    for (const p of myPublicPersonas) {
      // Existing followers for this persona
      const existing = await db
        .select({ requesterId: userConnections.requesterId })
        .from(userConnections)
        .where(eq(userConnections.targetPersonaId, p.id));
      const existingSet = new Set(existing.map((e) => e.requesterId));

      const rows = followerIds
        .filter((fid) => fid !== u.id && !existingSet.has(fid))
        .slice(0, 30)
        .map((fid) => ({
          requesterId: fid,
          targetPersonaId: p.id,
          targetUserId: u.id,
          connectionType: "follower" as ConnectionType,
          status: "accepted" as ConnectionStatus,
          accessLevel: "basic" as const,
          retainHistoricalData: true,
        }));

      if (rows.length > 0) {
        await db.insert(userConnections).values(rows);
      }
    }
  }
}

async function ensureFirst100CreatorFollows(usersCreated: CreatedUser[]) {
  const sorted = [...usersCreated].sort((a, b) =>
    a.email.localeCompare(b.email)
  );
  const first100 = sorted.slice(0, 100);
  const userIds = usersCreated.map((u) => u.id);

  for (const u of first100) {
    // Target at least 50 creators followed per user
    const target = 50;
    const candidates = shuffle(userIds.filter((id) => id !== u.id)).slice(
      0,
      target
    );

    // Fetch existing follows for this user
    const existing = await db
      .select({ followingId: userFollows.followingId })
      .from(userFollows)
      .where(eq(userFollows.followerId, u.id));
    const existingSet = new Set(existing.map((e) => e.followingId));

    const rows = candidates
      .filter((cid) => !existingSet.has(cid))
      .map((cid) => ({
        followerId: u.id,
        followingId: cid,
        followReason: "recommendation" as FollowReason,
        notifyOnNewPersona: true,
        notifyOnUpdates: true,
      }));

    if (rows.length > 0) {
      await db.insert(userFollows).values(rows);
    }
  }
}

async function ensureMinFeedItemsForAllUsers(
  usersCreated: CreatedUser[],
  minItems: number = 25
) {
  const feedService = new FeedAlgorithmService();
  for (const u of usersCreated) {
    const existing = await db
      .select({ id: feedItems.id })
      .from(feedItems)
      .where(eq(feedItems.userId, u.id));
    if (existing.length >= minItems) continue;

    // Generate and persist a fresh personalized feed with enough items
    await feedService.generatePersonalizedFeed(u.id, {
      limit: Math.max(minItems, 50),
      refreshExisting: true,
    });
  }
}

async function ensureSyntheticFeedItems(
  usersCreated: CreatedUser[],
  minItems: number = 25
) {
  // Create fallback feed items by sampling public personas
  const publicPersonas = await db
    .select({
      id: personas.id,
      userId: personas.userId,
    })
    .from(personas)
    .where(eq(personas.privacyLevel, "public"));

  if (publicPersonas.length === 0) return;

  for (const u of usersCreated) {
    const current = await db
      .select({ id: feedItems.id })
      .from(feedItems)
      .where(eq(feedItems.userId, u.id));

    const deficit = minItems - current.length;
    if (deficit <= 0) continue;

    const candidates = shuffle(
      publicPersonas.filter((p) => p.userId !== u.id)
    ).slice(0, Math.max(deficit, minItems));

    const rows = candidates.map((p, idx) => ({
      userId: u.id,
      itemType: "persona_recommendation" as const,
      personaId: p.id,
      creatorId: p.userId,
      algorithmSource: "personalized" as const,
      relevanceScore: (0.5 + Math.random() * 0.5).toFixed(2),
      feedPosition: idx + 1,
      isPromoted: false,
      isTrending: Math.random() < 0.2,
    }));

    if (rows.length > 0) {
      // Clear and insert deterministic set
      await db.delete(feedItems).where(eq(feedItems.userId, u.id));
      await db.insert(feedItems).values(rows.slice(0, minItems));
    }
  }
}

async function seedTrendingMetricsAndReviews(usersCreated: CreatedUser[]) {
  // Get public personas
  const publicPersonas = await db
    .select({ id: personas.id, userId: personas.userId })
    .from(personas)
    .where(eq(personas.privacyLevel, "public"));

  if (publicPersonas.length === 0) return;

  // Ensure discovery metrics rows exist and assign realistic numbers
  for (const p of publicPersonas) {
    // Upsert-style: try update; if 0 updated, insert
    const views24 = 200 + Math.floor(Math.random() * 2000);
    const views7 = views24 * (3 + Math.floor(Math.random() * 4));
    const views30 = views7 * (3 + Math.floor(Math.random() * 4));
    const likes24 = Math.floor(views24 * (0.05 + Math.random() * 0.1));
    const likes7 = likes24 * (3 + Math.floor(Math.random() * 4));
    const likes30 = likes7 * (3 + Math.floor(Math.random() * 4));
    const subs24 = Math.floor(views24 * (0.005 + Math.random() * 0.01));
    const subs7 = subs24 * (3 + Math.floor(Math.random() * 4));
    const subs30 = subs7 * (3 + Math.floor(Math.random() * 4));

    const updated = await db
      .update(discoveryMetrics)
      .set({
        viewsLast24h: views24,
        viewsLast7d: views7,
        viewsLast30d: views30,
        likesLast24h: likes24,
        likesLast7d: likes7,
        likesLast30d: likes30,
        subscriptionsLast24h: subs24,
        subscriptionsLast7d: subs7,
        subscriptionsLast30d: subs30,
        updatedAt: new Date(),
      })
      .where(eq(discoveryMetrics.personaId, p.id));

    if ((updated as any).rowCount === 0) {
      await db.insert(discoveryMetrics).values({
        personaId: p.id,
        viewsLast24h: views24,
        viewsLast7d: views7,
        viewsLast30d: views30,
        likesLast24h: likes24,
        likesLast7d: likes7,
        likesLast30d: likes30,
        subscriptionsLast24h: subs24,
        subscriptionsLast7d: subs7,
        subscriptionsLast30d: subs30,
      });
    }
  }

  // Seed a few approved reviews for a subset of personas to drive quality score
  const reviewers = usersCreated.map((u) => u.id);
  for (const p of publicPersonas.slice(
    0,
    Math.min(publicPersonas.length, 50)
  )) {
    const numReviews = 3 + Math.floor(Math.random() * 5);
    const reviewerIds = shuffle(
      reviewers.filter((id) => id !== p.userId)
    ).slice(0, numReviews);
    const rows = reviewerIds.map((rid) => ({
      userId: rid,
      personaId: p.id,
      rating: 3 + Math.floor(Math.random() * 3),
      title: "Great persona",
      reviewText: "Very helpful and engaging persona for my needs.",
      categories: ["personality", "responsiveness"],
      isVerifiedPurchase: Math.random() < 0.4,
      isPublic: true,
      moderationStatus: "approved" as const,
    }));
    await db.insert(personaReviews).values(rows);
  }
}
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function writeCredentialsFile(usersCreated: CreatedUser[]) {
  // Resolve repository root (apps/server/src/scripts -> repoRoot). __dirname is not available in ESM.
  const repoRoot = path.resolve(process.cwd(), "../..");
  const outDir = path.join(repoRoot, "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, ".local-seed-users.md");

  const lines: string[] = [];
  lines.push("# Local Seed Users (Do Not Commit)\n");
  lines.push(
    "This file lists the dummy user credentials generated for local/testing use."
  );
  lines.push("\n");
  lines.push("| # | Email | Name | Password |");
  lines.push("|---:|------|------|----------|");
  usersCreated.forEach((u, idx) => {
    lines.push(`| ${idx + 1} | ${u.email} | ${u.name} | ${u.password} |`);
  });
  lines.push("\n");
  lines.push(
    "Note: These accounts are dummy. If used in any public environment, rotate passwords."
  );

  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`\n📄 Credentials written to: ${outPath}`);
}

async function ensureGitIgnore() {
  // Ensure the credentials file is ignored from git at repo root
  const repoRoot = path.resolve(process.cwd(), "../..");
  const gitignorePath = path.join(repoRoot, ".gitignore");
  const entry = "data/.local-seed-users.md";
  try {
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, "utf8");
      if (!content.split(/\r?\n/).some((line) => line.trim() === entry)) {
        fs.appendFileSync(
          gitignorePath,
          `\n# Local seed credentials\n${entry}\n`
        );
        console.log("✅ Added credentials file to .gitignore");
      }
    } else {
      fs.writeFileSync(
        gitignorePath,
        `# Local seed credentials\n${entry}\n`,
        "utf8"
      );
      console.log("✅ Created .gitignore and added credentials entry");
    }
  } catch (err) {
    console.warn(
      "⚠️ Could not update .gitignore automatically. Please ensure 'data/.local-seed-users.md' is ignored."
    );
  }
}

async function main() {
  await ensureEnv();

  const total = Number(process.env.SEED_USER_COUNT || 300);
  const emailDomain = process.env.SEED_EMAIL_DOMAIN || "seed.local";

  console.log(`\n👥 Seeding ${total} users...`);
  const usersCreated = await createUsers(total, emailDomain);
  console.log(`✅ Users ensured: ${usersCreated.length}`);

  console.log("👤 Creating personas (main + public)...");
  await createPersonas(usersCreated);
  console.log("✅ Personas created");

  console.log("🔗 Creating follow relationships...");
  await createFollows(usersCreated);
  console.log("✅ Follows created");

  console.log("❤️ Creating persona likes...");
  await createLikes(usersCreated);
  console.log("✅ Likes created");

  console.log("👥 Ensuring first 100 users follow at least 50 creators...");
  await ensureFirst100CreatorFollows(usersCreated);
  console.log("✅ First 100 users now follow many creators");

  console.log("👣 Ensuring first 100 users are following personas...");
  await ensureFirst100PersonaFollowing(usersCreated);
  console.log("✅ First 100 users now follow multiple personas");

  console.log("📈 Ensuring first 100 users' personas have followers...");
  await ensureFirst100PersonaFollowers(usersCreated);
  console.log("✅ First 100 users' personas now have followers");

  console.log("📰 Generating feed content for all users (>=25 items each)...");
  await ensureMinFeedItemsForAllUsers(usersCreated, 25);
  console.log("✅ All users now have at least 25 feed items");

  console.log("🧪 Backfilling synthetic feed items where needed...");
  await ensureSyntheticFeedItems(usersCreated, 25);
  console.log("✅ Synthetic feed backfill complete");

  console.log("📊 Seeding trending metrics and reviews for public personas...");
  await seedTrendingMetricsAndReviews(usersCreated);
  console.log("✅ Trending metrics and sample reviews seeded");

  console.log("📝 Writing credentials file (hidden from git)...");
  await writeCredentialsFile(usersCreated);
  await ensureGitIgnore();

  console.log(
    "\n🎉 Seeding complete. You can now log in and view a populated feed."
  );
}

// Export main function for Lambda usage
export { main };

// Only run if this is the main module (CLI execution)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
}
