/**
 * P0 Security 6.3: log without tokens/PII. Redact known sensitive keys before logging.
 */
const SENSITIVE_KEYS = [
  "authorization",
  "cookie",
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "accessToken",
  "refreshToken",
  "creditCard",
  "ssn",
  "email",
  "phone",
];

function redact(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = redact(v);
    }
  }
  return out;
}

/**
 * Log for API/server. Redacts sensitive keys from meta. Use instead of console.log when meta may contain headers/body.
 */
export function logApi(
  message: string,
  meta?: Record<string, unknown> | null,
  requestId?: string | null
): void {
  const safe = meta ? redact(meta) : {};
  const prefix = requestId ? `[${requestId}] ` : "";
  if (process.env.NODE_ENV === "production") {
    console.error(prefix + message, Object.keys(safe).length > 0 ? safe : "");
  } else {
    console.log(prefix + message, Object.keys(safe).length > 0 ? safe : "");
  }
}
