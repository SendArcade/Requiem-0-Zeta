import path from "path";
import { fileURLToPath } from "url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Consumer SPA routes served from the Vite build copied into `public/`.
 * Explicit list only — never a global fallback that can catch Requiem routes.
 */
const CONSUMER_ROUTES = [
  "/",
  "/market",
  "/market/:path*",
  "/lab",
  "/gallery",
  "/hub",
  "/game",
  "/screens",
  "/docs",
  "/docs/:path*",
  "/x",
  "/x/:path*",
  "/burst",
  "/burst/:path*",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Linux/Railway image uses the standalone server. Windows local builds cannot
  // create the standalone symlinks (EPERM), so set NEXT_OUTPUT_STANDALONE=0 there.
  output: process.env.NEXT_OUTPUT_STANDALONE === "0" ? undefined : "standalone",
  outputFileTracingRoot: path.join(appDir, "../.."),
  outputFileTracingIncludes: {
    "/requiem": ["../../packages/catalog/data/**/*"],
    "/browse": ["../../packages/catalog/data/**/*"],
    "/browse/:path*": ["../../packages/catalog/data/**/*"],
    "/product/:path*": ["../../packages/catalog/data/**/*"],
    "/asset/:path*": ["../../packages/catalog/data/**/*"],
    "/search": ["../../packages/catalog/data/**/*"],
    "/watchlist": ["../../packages/catalog/data/**/*"],
    "/admin/:path*": ["../../packages/catalog/data/**/*"],
    "/api/:path*": ["../../packages/catalog/data/**/*"],
  },
  transpilePackages: ["@beyoracle/catalog", "@beyoracle/oracle", "@beyoracle/shared"],
  serverExternalPackages: [
    "@beyoracle/ingest",
    "@beyoracle/db",
    "@beyoracle/events",
    "postgres",
    "ioredis",
    "bullmq",
  ],
  async rewrites() {
    return {
      fallback: CONSUMER_ROUTES.map((source) => ({
        source,
        destination: "/index.html",
      })),
    };
  },
};

export default nextConfig;
