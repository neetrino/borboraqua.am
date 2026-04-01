import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// P0 Security 4.2: pooled URL + connection limit for serverless (Neon)
const DEFAULT_CONNECTION_LIMIT = 10;
/** Seconds — Prisma default is 10; under load (many parallel RSC + API) P2024 is common without a higher wait. */
const DEFAULT_POOL_TIMEOUT_SEC = 20;
const databaseUrl = process.env.DATABASE_URL || "";
let urlWithEncoding = databaseUrl;

if (databaseUrl) {
  if (!databaseUrl.includes("client_encoding")) {
    urlWithEncoding = databaseUrl.includes("?")
      ? `${databaseUrl}&client_encoding=UTF8`
      : `${databaseUrl}?client_encoding=UTF8`;
  }
  if (!urlWithEncoding.includes("connection_limit")) {
    urlWithEncoding += urlWithEncoding.includes("?") ? "&" : "?";
    urlWithEncoding += `connection_limit=${process.env.DATABASE_CONNECTION_LIMIT ?? DEFAULT_CONNECTION_LIMIT}`;
  }
  if (!urlWithEncoding.includes("pool_timeout")) {
    urlWithEncoding += urlWithEncoding.includes("?") ? "&" : "?";
    const poolTimeout =
      process.env.DATABASE_POOL_TIMEOUT ?? String(DEFAULT_POOL_TIMEOUT_SEC);
    urlWithEncoding += `pool_timeout=${poolTimeout}`;
  }
  process.env.DATABASE_URL = urlWithEncoding;
}

// Single cached client: must use globalThis in production too — Next can load multiple
// server chunks; without this, duplicate PrismaClient instances exhaust Neon/Vercel pools (P2024).
export const db: PrismaClient =
  globalForPrisma.prisma ??
  (globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
  }));

