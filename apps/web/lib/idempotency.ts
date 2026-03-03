/**
 * Idempotency for critical POST (P0 Security 3.4). In-memory store; for multi-instance use Redis.
 */
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface Entry {
  body: unknown;
  status: number;
  expiresAt: number;
}

const store = new Map<string, Entry>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, e] of store.entries()) {
    if (e.expiresAt < now) store.delete(key);
  }
}

export function getIdempotentResponse(key: string): { body: unknown; status: number } | null {
  if (store.size > 10_000) cleanup();
  const e = store.get(key);
  if (!e || e.expiresAt < Date.now()) return null;
  return { body: e.body, status: e.status };
}

export function setIdempotentResponse(key: string, body: unknown, status: number): void {
  store.set(key, {
    body,
    status,
    expiresAt: Date.now() + TTL_MS,
  });
}
