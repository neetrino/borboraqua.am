/**
 * Idempotency for critical POST (P0 Security 3.4).
 * Uses Upstash when configured; otherwise in-memory Map.
 */

import { createHash } from "node:crypto";
import { getUpstashRedis } from "@/lib/upstash-redis";

const TTL_MS = 24 * 60 * 60 * 1000; // 24h

const REDIS_KEY_PREFIX = "bba:idem:";

interface MemoryEntry {
  body: unknown;
  status: number;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

function storageKey(idempotencyKey: string): string {
  return `${REDIS_KEY_PREFIX}${createHash("sha256").update(idempotencyKey, "utf8").digest("hex")}`;
}

function memoryCleanup(): void {
  const now = Date.now();
  for (const [key, e] of memoryStore.entries()) {
    if (e.expiresAt < now) memoryStore.delete(key);
  }
}

export async function getIdempotentResponse(
  key: string
): Promise<{ body: unknown; status: number } | null> {
  const redis = getUpstashRedis();
  if (redis) {
    try {
      const raw = await redis.get(storageKey(key));
      if (raw === null || raw === undefined) return null;
      if (typeof raw !== "string") return null;
      const parsed = JSON.parse(raw) as { body: unknown; status: number };
      if (typeof parsed.status !== "number" || !("body" in parsed)) return null;
      return { body: parsed.body, status: parsed.status };
    } catch (err) {
      console.error("[idempotency] Redis get error, using memory", err);
    }
  }
  if (memoryStore.size > 10_000) memoryCleanup();
  const e = memoryStore.get(key);
  if (!e || e.expiresAt < Date.now()) return null;
  return { body: e.body, status: e.status };
}

export async function setIdempotentResponse(
  key: string,
  body: unknown,
  status: number
): Promise<void> {
  const payload = JSON.stringify({ body, status });
  const redis = getUpstashRedis();
  if (redis) {
    try {
      await redis.set(storageKey(key), payload, { px: TTL_MS });
      return;
    } catch (err) {
      console.error("[idempotency] Redis set error, using memory", err);
    }
  }
  memoryStore.set(key, {
    body,
    status,
    expiresAt: Date.now() + TTL_MS,
  });
}
