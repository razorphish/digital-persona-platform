import "dotenv/config";
import { db, users, feedItems } from "@digital-persona/database";
import { eq } from "drizzle-orm";

async function main(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }
  const items = await db
    .select()
    .from(feedItems)
    .where(eq(feedItems.userId, user.id));
  console.log(
    JSON.stringify(
      {
        user: { id: user.id, email: user.email, name: user.name },
        feedCount: items.length,
      },
      null,
      2
    )
  );
}

const email = process.argv[2] || "user001@seed.local";
main(email).catch((e) => {
  console.error(e);
  process.exit(1);
});
