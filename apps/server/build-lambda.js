#!/usr/bin/env node

/**
 * Lambda Build Script using esbuild
 *
 * This script bundles the Lambda function properly by:
 * 1. Bundling all dependencies into a single file
 * 2. Converting ES modules to CommonJS for Lambda compatibility
 * 3. Including workspace packages
 * 4. Excluding unnecessary files
 */

import esbuild from "esbuild";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  statSync,
  readdirSync,
  copyFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 Building Lambda function with esbuild...");

// Ensure output directory exists
const outDir = join(__dirname, "lambda-dist");
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

try {
  // Build configuration
  const buildConfig = {
    entryPoints: [join(__dirname, "src/index-lambda.ts")],
    bundle: true,
    outfile: join(outDir, "index.js"),
    platform: "node",
    target: "node18",
    format: "cjs", // CommonJS for Lambda compatibility
    external: [
      // AWS SDK is provided by Lambda runtime
      "aws-sdk",
      "@aws-sdk/*",
      // Native modules that need to be included as-is
      "pg-native",
    ],
    define: {
      // Define process.env for bundling
      "process.env.NODE_ENV": '"production"',
    },
    sourcemap: false,
    minify: true,
    keepNames: true,
    banner: {
      js: "// Lambda function bundled with esbuild",
    },
    plugins: [
      {
        name: "workspace-packages",
        setup(build) {
          // Handle workspace package imports
          build.onResolve({ filter: /^@digital-persona\// }, (args) => {
            console.log(`📦 Resolving workspace package: ${args.path}`);
            const packageName = args.path.split("/")[1]; // 'shared' or 'database'
            const packagePath = join(
              __dirname,
              "../../packages",
              packageName,
              "src/index.ts"
            );

            if (existsSync(packagePath)) {
              return { path: packagePath };
            }

            // Fallback to built version
            const builtPath = join(
              __dirname,
              "../../packages",
              packageName,
              "dist/index.js"
            );
            if (existsSync(builtPath)) {
              return { path: builtPath };
            }

            console.warn(
              `⚠️ Could not resolve workspace package: ${args.path}`
            );
            return null;
          });
        },
      },
    ],
    logLevel: "info",
  };

  // Build the Lambda function
  await esbuild.build(buildConfig);

  // Create a minimal package.json for the Lambda
  const lambdaPackageJson = {
    name: "lambda-function",
    version: "1.0.0",
    type: "commonjs",
    main: "index.js",
  };

  writeFileSync(
    join(outDir, "package.json"),
    JSON.stringify(lambdaPackageJson, null, 2)
  );

  // Copy migration files for database migrations
  console.log("📋 Copying migration files...");
  const drizzleSourceDir = join(__dirname, "drizzle");
  const drizzleDestDir = join(outDir, "drizzle");

  if (existsSync(drizzleSourceDir)) {
    // Create drizzle directory in output
    if (!existsSync(drizzleDestDir)) {
      mkdirSync(drizzleDestDir, { recursive: true });
    }

    // Copy all files from drizzle directory
    const copyRecursively = (src, dest) => {
      const stat = statSync(src);
      if (stat.isDirectory()) {
        if (!existsSync(dest)) {
          mkdirSync(dest, { recursive: true });
        }
        const entries = readdirSync(src);
        for (const entry of entries) {
          copyRecursively(join(src, entry), join(dest, entry));
        }
      } else {
        copyFileSync(src, dest);
      }
    };

    copyRecursively(drizzleSourceDir, drizzleDestDir);
    console.log("✅ Migration files copied successfully");
  } else {
    console.warn("⚠️ No migration files found in drizzle directory");
  }

  console.log("✅ Lambda function built successfully!");
  console.log(`📁 Output directory: ${outDir}`);
  console.log("📦 Files created:");
  console.log("  - index.js (bundled Lambda function)");
  console.log("  - package.json (Lambda package metadata)");
  console.log("  - drizzle/ (migration files)");
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}
