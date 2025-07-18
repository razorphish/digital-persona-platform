/** @type {import('next').NextConfig} */
const nextConfig = {
  // For development, use standalone mode
  output: process.env.NODE_ENV === "production" ? "export" : "standalone",
  // Only add trailingSlash and unoptimized images for production export
  ...(process.env.NODE_ENV === "production" && {
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  }),
  experimental: {
    appDir: true,
  },
  transpilePackages: ["@digital-persona/shared", "@digital-persona/database"],
  env: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001",
  },
};

module.exports = nextConfig;
