/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use export mode for static deployment, standalone for server deployment
  output: process.env.NEXT_BUILD_EXPORT === "true" ? "export" : "standalone",
  // Add unoptimized images for static export
  ...(process.env.NEXT_BUILD_EXPORT === "true" && {
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  }),
  transpilePackages: ["@digital-persona/shared", "@digital-persona/database"],

  // Development optimizations to reduce warnings
  experimental: {
    // optimizeCss: true, // Disabled to avoid critters dependency issue
  },

  // Better source map handling for development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = "cheap-module-source-map";
    }
    return config;
  },
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
