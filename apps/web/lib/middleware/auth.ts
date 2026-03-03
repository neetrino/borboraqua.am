import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { db } from "@white-shop/db";
import { isBlacklisted } from "@/lib/token-blacklist";
import { logApi } from "@/lib/safe-log";
import { getRequestId } from "@/lib/request-id";

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  locale: string;
  roles: string[];
}

/**
 * Authenticate JWT token from request headers
 */
export async function authenticateToken(
  request: NextRequest
): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1]; // Bearer TOKEN

    const requestId = getRequestId(request);

    if (!token) {
      logApi("AUTH: No token provided", null, requestId);
      return null;
    }

    if (!process.env.JWT_SECRET) {
      logApi("AUTH: JWT_SECRET not set", null, requestId);
      return null;
    }

    if (isBlacklisted(token)) {
      logApi("AUTH: Token revoked (logout)", null, requestId);
      return null;
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as {
        userId: string;
      };
      logApi("AUTH: Token verified", { userId: decoded.userId }, requestId);
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        logApi("AUTH: Invalid JWT", { reason: (jwtError as Error).message }, requestId);
      } else if (jwtError instanceof jwt.TokenExpiredError) {
        logApi("AUTH: Token expired", null, requestId);
      } else {
        logApi("AUTH: JWT error", null, requestId);
      }
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        locale: true,
        roles: true,
        blocked: true,
        deletedAt: true,
      },
    });

    if (!user) {
      logApi("AUTH: User not found", { userId: decoded.userId }, requestId);
      return null;
    }

    if (user.blocked) {
      logApi("AUTH: User blocked", { userId: decoded.userId }, requestId);
      return null;
    }

    if (user.deletedAt) {
      logApi("AUTH: User deleted", { userId: decoded.userId }, requestId);
      return null;
    }

    logApi("AUTH: Authenticated", { userId: user.id, roles: user.roles }, requestId);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      locale: user.locale,
      roles: user.roles,
    };
  } catch (error) {
    logApi("AUTH: Unexpected error", { message: error instanceof Error ? error.message : String(error) }, getRequestId(request));
    throw error;
  }
}

/**
 * Check if user is admin
 */
export function requireAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.roles.includes("admin");
}

/**
 * RBAC: require authenticated admin (P0 Security 2.4). Use in admin route handlers.
 * Returns { user } or NextResponse 401/403.
 */
export async function requireAuthAdmin(
  request: NextRequest
): Promise<{ user: AuthUser; response: null } | { user: null; response: NextResponse }> {
  const user = await authenticateToken(request);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Unauthorized", detail: "Invalid or missing token" },
        { status: 401 }
      ),
    };
  }
  if (!requireAdmin(user)) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Forbidden", detail: "Admin role required" },
        { status: 403 }
      ),
    };
  }
  return { user, response: null };
}

