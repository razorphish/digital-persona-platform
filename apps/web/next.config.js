/** @type {import('next').NextConfig} */
const nextConfig = {
  // For development, use standalone mode
  output: process.env.NODE_ENV === "production" ? "standalone" : "standalone",
  // Only add trailingSlash and unoptimized images for production export
  ...(process.env.NODE_ENV === "production" && {
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  }),
  transpilePackages: ["@digital-persona/shared", "@digital-persona/database"],
  env: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "build-time-secret",
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    DATABASE_URL:
      process.env.DATABASE_URL || "postgres://localhost:5432/hibiji",
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001",
  },
};

module.exports = nextConfig;
