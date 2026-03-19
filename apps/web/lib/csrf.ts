import { NextRequest, NextResponse } from "next/server";

/**
 * Allowed origins for mutating requests (P0 Security 2.3).
 * Uses APP_URL (single canonical app URL) and/or ALLOWED_ORIGINS (comma-separated list).
 * Empty = allow same-origin only (no Origin or Referer from same host).
 */
function getAllowedOrigins(): string[] {
  const list: string[] = [];
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    try {
      const u = new URL(appUrl);
      list.push(`${u.protocol}//${u.host}`);
    } catch {
      // ignore invalid APP_URL
    }
  }
  const env = process.env.ALLOWED_ORIGINS;
  if (env) {
    for (const o of env.split(",").map((s) => s.trim()).filter(Boolean)) {
      if (o && !list.includes(o)) list.push(o);
    }
  }
  return list;
}

/**
 * Validate Origin/Referer for CSRF protection. Call on POST/PUT/PATCH/DELETE.
 * Returns null if valid; returns NextResponse with 403 if invalid.
 */
export function validateOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = getAllowedOrigins();

  // Same-origin request often sends no Origin (e.g. form POST from same site)
  if (!origin && !referer) return null;

  const url = request.nextUrl;
  const host = url.host;
  const hostname = url.hostname;
  const protocol = url.protocol;
  const thisOrigin = `${protocol}//${host}`;

  // In development, when server is localhost, allow any origin (browser may use tunnel URL like https://dev.example.com)
  if (process.env.NODE_ENV === "development" && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return null;
  }

  const check = (value: string): boolean => {
    try {
      const u = new URL(value);
      const o = `${u.protocol}//${u.host}`;
      if (o === thisOrigin) return true;
      if (allowed.includes(o) || allowed.includes(u.origin)) return true;
      return false;
    } catch {
      return false;
    }
  };

  if (origin && !check(origin)) {
    return new NextResponse(
      JSON.stringify({ error: "Forbidden", detail: "Invalid origin" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  if (referer && !check(referer)) {
    return new NextResponse(
      JSON.stringify({ error: "Forbidden", detail: "Invalid referer" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
