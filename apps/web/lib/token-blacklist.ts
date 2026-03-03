/**
 * In-memory token blacklist for logout invalidation (P0 Security 2.7).
 * Tokens are stored until natural JWT expiry; for multi-instance use Redis.
 */

const blacklist = new Map<string, number>();
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days max

function cleanup(): void {
  const now = Date.now();
  for (const [token, expiresAt] of blacklist.entries()) {
    if (expiresAt < now) blacklist.delete(token);
  }
}

export function addToBlacklist(token: string, expiresAtMs: number): void {
  if (blacklist.size > 50_000) cleanup();
  blacklist.set(token, expiresAtMs);
}

export function isBlacklisted(token: string): boolean {
  const expiresAt = blacklist.get(token);
  if (expiresAt === undefined) return false;
  if (expiresAt < Date.now()) {
    blacklist.delete(token);
    return false;
  }
  return true;
}
