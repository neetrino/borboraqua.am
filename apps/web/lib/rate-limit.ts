/**
 * In-memory rate limiter for auth/API/forms (P0 Security 1.4).
 * For multi-instance production, use Cloudflare WAF Rate rules or Upstash Redis.
 */

const WINDOW_MS = 60_000; // 1 minute

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function getKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}

/**
 * Check rate limit. Returns null if allowed, or Retry-After seconds if limited.
 */
export function checkRateLimit(request: Request, limit: number, pathLabel: string): number | null {
  const ip = getClientIp(request);
  const key = getKey(ip, pathLabel);
  const now = Date.now();

  if (store.size > 10_000) cleanup();

  let entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }
  entry.count += 1;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return retryAfter;
  }
  return null;
}

export const RATE_LIMITS = {
  /** /api/v1/auth/* — login, register */
  AUTH_PER_MIN: 50,
  /** /api/v1/contact — contact form */
  CONTACT_PER_MIN: 20,
  /** General /api/* */
  API_PER_MIN: 100,
} as const;
