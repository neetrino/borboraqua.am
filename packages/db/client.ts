import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// P0 Security 4.2: pooled URL + connection limit for serverless (Neon)
const DEFAULT_CONNECTION_LIMIT = 10;
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
  process.env.DATABASE_URL = urlWithEncoding;
}

// Single cached client (serverless: reuse, avoid "too many connections")
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
  });

// Set UTF-8 encoding after connection to ensure proper character handling
// This is critical for Armenian and other Unicode characters
db.$connect()
  .then(async () => {
    try {
      // Explicitly set client encoding to UTF-8
      await db.$executeRawUnsafe(`SET client_encoding TO 'UTF8'`);
      console.log("✅ [DB] Client encoding set to UTF-8");
    } catch (error: any) {
      // Log but don't fail - connection might already have correct encoding
      console.warn("⚠️ [DB] Could not set client encoding:", error?.message);
    }
  })
  .catch((error) => {
    console.error("❌ [DB] Prisma connection error:", {
      message: error?.message,
      code: error?.code,
      name: error?.name,
    });
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

