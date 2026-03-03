import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { addToBlacklist } from "@/lib/token-blacklist";

/**
 * POST /api/v1/auth/logout — invalidate current token (P0 Security 2.7).
 * Client should send Authorization: Bearer <token>; after this, the token returns 401.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      const expiresAtMs = decoded?.exp ? decoded.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;
      addToBlacklist(token, expiresAtMs);
    } catch {
      // ignore decode errors
    }
  }

  return new NextResponse(null, { status: 204 });
}
