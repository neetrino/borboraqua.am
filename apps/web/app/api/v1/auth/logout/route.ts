import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { addToBlacklist } from "@/lib/token-blacklist";
import { clearAuthCookie, getAuthTokenFromRequest } from "@/lib/auth-cookie";

/**
 * POST /api/v1/auth/logout — invalidate current token (P0 Security 2.7).
 * Client should send Authorization: Bearer <token>; after this, the token returns 401.
 */
export async function POST(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);

  if (token) {
    try {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      const expiresAtMs = decoded?.exp ? decoded.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;
      addToBlacklist(token, expiresAtMs);
    } catch {
      // ignore decode errors
    }
  }

  const response = new NextResponse(null, { status: 204 });
  clearAuthCookie(response);
  return response;
}
