import path from "path";
import { fileURLToPath } from "url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Linux/Railway image uses the standalone server. Windows local builds cannot
  // create the standalone symlinks (EPERM), so set NEXT_OUTPUT_STANDALONE=0 there.
  output: process.env.NEXT_OUTPUT_STANDALONE === "0" ? undefined : "standalone",
  experimental: { globalNotFound: true },
  env: {
    NEXT_PUBLIC_MARKET_OPEN: process.env.NEXT_PUBLIC_MARKET_OPEN ?? process.env.VITE_MARKET_OPEN ?? '',
    NEXT_PUBLIC_REQUIEM_API_BASE: process.env.NEXT_PUBLIC_REQUIEM_API_BASE ?? process.env.VITE_REQUIEM_API_BASE ?? '',
  },
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
    "@beyoracle/pricing-service",
    "@beyoracle/db",
    "@beyoracle/events",
    "postgres",
    "ioredis",
  ],
};

export default nextConfig;
