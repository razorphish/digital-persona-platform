ALTER TABLE "personas" ADD COLUMN "category" text DEFAULT 'general';--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "profile_picture" text;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "is_public" boolean DEFAULT false;