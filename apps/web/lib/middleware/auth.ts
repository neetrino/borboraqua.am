import { NextRequest } from "next/server";
import * as jwt from "jsonwebtoken";
import { db } from "@white-shop/db";

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

    if (!token) {
      console.log("🔍 [AUTH] No token provided in Authorization header");
      return null;
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ [AUTH] JWT_SECRET is not set!");
      return null;
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as {
        userId: string;
      };
      console.log("✅ [AUTH] Token verified successfully, userId:", decoded.userId);
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        console.log("❌ [AUTH] Invalid JWT token:", jwtError.message);
      } else if (jwtError instanceof jwt.TokenExpiredError) {
        console.log("❌ [AUTH] Token expired:", jwtError.expiredAt);
      } else {
        console.log("❌ [AUTH] JWT verification error:", jwtError);
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
      console.log("❌ [AUTH] User not found for userId:", decoded.userId);
      return null;
    }

    if (user.blocked) {
      console.log("❌ [AUTH] User is blocked:", decoded.userId);
      return null;
    }

    if (user.deletedAt) {
      console.log("❌ [AUTH] User is deleted:", decoded.userId);
      return null;
    }

    console.log("✅ [AUTH] User authenticated successfully:", {
      id: user.id,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
    });

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      locale: user.locale,
      roles: user.roles,
    };
  } catch (error) {
    console.error("❌ [AUTH] Unexpected error during authentication:", error);
    throw error;
  }
}

/**
 * Check if user is admin
 */
export function requireAdmin(user: AuthUser | null): boolean {
  if (!user) {
    console.log("❌ [AUTH] requireAdmin: User is null");
    return false;
  }
  
  const isAdmin = user.roles.includes("admin");
  console.log("🔍 [AUTH] requireAdmin check:", {
    userId: user.id,
    roles: user.roles,
    isAdmin,
  });
  
  return isAdmin;
}

