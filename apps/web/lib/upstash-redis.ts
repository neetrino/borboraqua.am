import { Redis } from "@upstash/redis";

let cached: Redis | null | undefined;

/**
 * Lazy singleton for Upstash REST Redis. Returns null if URL/token missing (in-memory fallback).
 */
export function getUpstashRedis(): Redis | null {
  if (cached !== undefined) {
    return cached;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    cached = null;
    return cached;
  }
  cached = new Redis({ url, token });
  return cached;
}
