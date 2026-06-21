import type { NextConfig } from "next";
import { config } from "dotenv";

config();

const nextConfig: NextConfig = {
  // Emit a self-contained server (.next/standalone) with only the traced
  // node_modules, so the Docker runtime image stays small.
  output: "standalone",
  // Keep the native better-sqlite3 binding (used by the Prisma driver adapter in
  // lib/db.ts) out of the server bundle so route handlers can load it at runtime.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // Serve assets from this origin only if explicitly configured (e.g. behind a
  // CDN). Defaults to none so the app serves its own static assets — important
  // for the self-hosted Docker image.
  assetPrefix: process.env.ASSET_PREFIX || undefined,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost"
      },
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  }
};

export default nextConfig;
