import { NextRequest, NextResponse } from "next/server";
import { getRequestId } from "@/lib/request-id";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Safe detail for client (P0 Security 3.2, 3.2a): no stack, no internal paths, no secrets */
function safeDetail(error: unknown, fallback: string): string {
  if (IS_PRODUCTION) return fallback;
  if (error && typeof error === "object" && "detail" in error && typeof (error as { detail: string }).detail === "string")
    return (error as { detail: string }).detail;
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * Build JSON error response for API routes. In production: no stack, no sensitive data.
 * Adds X-Request-Id header when available (6.1).
 */
export function safeErrorResponse(
  req: NextRequest,
  error: unknown,
  options: {
    status?: number;
    fallbackDetail?: string;
    /** Allow this detail in prod (e.g. validation message) */
    allowDetailInProd?: string;
  } = {}
): NextResponse {
  const status = options.status ?? (error && typeof error === "object" && "status" in error ? (error as { status: number }).status : 500);
  const fallback = options.fallbackDetail ?? "An error occurred";
  const detail = options.allowDetailInProd ?? safeDetail(error, fallback);

  const body: Record<string, unknown> = {
    type: "https://api.shop.am/problems/internal-error",
    title: status >= 500 ? "Internal Server Error" : "Request Error",
    status,
    detail,
    instance: req.url,
  };

  if (!IS_PRODUCTION && error instanceof Error && error.stack) {
    body.debug = { message: error.message };
  }

  const res = NextResponse.json(body, { status });
  const requestId = getRequestId(req);
  if (requestId) res.headers.set("X-Request-Id", requestId);
  return res;
}
