/**
 * Webhook signature and replay protection (P0 Security 3.5).
 * Use when adding routes that receive callbacks from payment providers (e.g. FastShift, Idram).
 *
 * - Verify signature: HMAC of body with provider secret from env; compare to X-Signature header.
 * - Replay: store processed event IDs with TTL; reject if event ID already seen or timestamp too old.
 */

import { createHmac, timingSafeEqual } from "crypto";

const PROCESSED_IDS = new Map<string, number>();
const REPLAY_TTL_MS = 10 * 60 * 1000; // 10 min
const MAX_AGE_MS = 5 * 60 * 1000; // reject if timestamp older than 5 min

function cleanup(): void {
  const now = Date.now();
  for (const [id, expiresAt] of PROCESSED_IDS.entries()) {
    if (expiresAt < now) PROCESSED_IDS.delete(id);
  }
}

/**
 * Verify HMAC-SHA256 signature. secret from env (e.g. FASTSHIFT_WEBHOOK_SECRET).
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signatureHeader: string | null,
  secret: string | undefined
): boolean {
  if (!secret || !signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const provided = signatureHeader.replace(/^sha256=/, "").trim();
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
}

/**
 * Replay protection: returns true if event was already processed or too old.
 */
export function isReplay(eventId: string, timestampMs?: number): boolean {
  if (PROCESSED_IDS.size > 50_000) cleanup();
  if (timestampMs && Date.now() - timestampMs > MAX_AGE_MS) return true;
  if (PROCESSED_IDS.has(eventId)) return true;
  PROCESSED_IDS.set(eventId, Date.now() + REPLAY_TTL_MS);
  return false;
}
