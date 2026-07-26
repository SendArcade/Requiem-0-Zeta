/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@beyoracle/catalog", "@beyoracle/oracle", "@beyoracle/shared"],
  serverExternalPackages: [
    "@beyoracle/ingest",
    "@beyoracle/db",
    "@beyoracle/events",
    "postgres",
    "ioredis",
    "bullmq",
  ],
};

export default nextConfig;
