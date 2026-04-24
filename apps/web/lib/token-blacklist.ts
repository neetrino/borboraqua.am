/**
 * Token blacklist for logout invalidation (P0 Security 2.7).
 * Uses Upstash when configured; otherwise in-memory Map.
 */

import { createHash } from "node:crypto";
import { getUpstashRedis } from "@/lib/upstash-redis";

const REDIS_KEY_PREFIX = "bba:bl:";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days max

const memoryBlacklist = new Map<string, number>();

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function redisKey(token: string): string {
  return `${REDIS_KEY_PREFIX}${hashToken(token)}`;
}

function memoryCleanup(): void {
  const now = Date.now();
  for (const [t, expiresAt] of memoryBlacklist.entries()) {
    if (expiresAt < now) memoryBlacklist.delete(t);
  }
}

export async function addToBlacklist(token: string, expiresAtMs: number): Promise<void> {
  const capped = Math.min(expiresAtMs, Date.now() + MAX_AGE_MS);
  const redis = getUpstashRedis();
  if (redis) {
    try {
      const pxat = Math.max(1, capped - Date.now());
      await redis.set(redisKey(token), "1", { px: pxat });
      return;
    } catch (err) {
      console.error("[token-blacklist] Redis error, using memory", err);
    }
  }
  if (memoryBlacklist.size > 50_000) memoryCleanup();
  memoryBlacklist.set(token, capped);
}

export async function isBlacklisted(token: string): Promise<boolean> {
  const redis = getUpstashRedis();
  if (redis) {
    try {
      const v = await redis.get(redisKey(token));
      return v !== null && v !== undefined;
    } catch (err) {
      console.error("[token-blacklist] Redis error, using memory", err);
    }
  }
  const expiresAt = memoryBlacklist.get(token);
  if (expiresAt === undefined) return false;
  if (expiresAt < Date.now()) {
    memoryBlacklist.delete(token);
    return false;
  }
  return true;
}
