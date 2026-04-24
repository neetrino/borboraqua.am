/**
 * Rate limiter for auth/API/forms (P0 Security 1.4).
 * Uses Upstash Redis when UPSTASH_REDIS_REST_* are set; otherwise in-memory Map.
 */

import { getUpstashRedis } from "@/lib/upstash-redis";

const WINDOW_MS = 60_000; // 1 minute

const REDIS_KEY_PREFIX = "bba:rl:";

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function getKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

function memoryCleanup(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt < now) memoryStore.delete(key);
  }
}

function checkRateLimitMemory(request: Request, limit: number, pathLabel: string): number | null {
  const ip = getClientIp(request);
  const key = getKey(ip, pathLabel);
  const now = Date.now();

  if (memoryStore.size > 10_000) memoryCleanup();

  let entry = memoryStore.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    memoryStore.set(key, entry);
  }
  entry.count += 1;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return retryAfter;
  }
  return null;
}

async function checkRateLimitRedis(
  request: Request,
  limit: number,
  pathLabel: string
): Promise<number | null> {
  const redis = getUpstashRedis();
  if (!redis) return checkRateLimitMemory(request, limit, pathLabel);

  const ip = getClientIp(request);
  const key = `${REDIS_KEY_PREFIX}${pathLabel}:${ip}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.pexpire(key, WINDOW_MS);
  }

  if (count > limit) {
    const pttl = await redis.pttl(key);
    const retryAfter = Math.ceil(Math.max(pttl, 0) / 1000) || 1;
    return retryAfter;
  }
  return null;
}

/**
 * Check rate limit. Returns null if allowed, or Retry-After seconds if limited.
 */
export async function checkRateLimit(
  request: Request,
  limit: number,
  pathLabel: string
): Promise<number | null> {
  if (!getUpstashRedis()) {
    return checkRateLimitMemory(request, limit, pathLabel);
  }
  try {
    return await checkRateLimitRedis(request, limit, pathLabel);
  } catch (err) {
    console.error("[rate-limit] Redis error, using in-memory fallback", err);
    return checkRateLimitMemory(request, limit, pathLabel);
  }
}

export const RATE_LIMITS = {
  /** /api/v1/auth/* — login, register */
  AUTH_PER_MIN: 50,
  /** /api/v1/auth/register — stricter anti-bot limit */
  AUTH_REGISTER_PER_MIN: 5,
  /** /api/v1/contact — contact form */
  CONTACT_PER_MIN: 20,
  /** General /api/* */
  API_PER_MIN: 100,
} as const;
