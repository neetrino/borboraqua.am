import { NextRequest } from "next/server";

/** P0 Security 6.1: get request-id (set by middleware) for logging and response headers. */
export function getRequestId(request: NextRequest): string | null {
  return request.headers.get("x-request-id");
}
