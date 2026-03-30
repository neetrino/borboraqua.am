import { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "auth_token";
const DEFAULT_AUTH_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

function parseJwtExpiresInToSeconds(value: string | undefined): number {
  if (!value) return DEFAULT_AUTH_COOKIE_MAX_AGE_SECONDS;
  const trimmedValue = value.trim();
  const asNumber = Number(trimmedValue);
  if (Number.isFinite(asNumber) && asNumber > 0) return Math.floor(asNumber);

  const match = /^(\d+)\s*([smhd])$/i.exec(trimmedValue);
  if (!match) return DEFAULT_AUTH_COOKIE_MAX_AGE_SECONDS;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitMap: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };
  return amount * (unitMap[unit] ?? DEFAULT_AUTH_COOKIE_MAX_AGE_SECONDS);
}

export function getAuthCookieMaxAgeSeconds(): number {
  return parseJwtExpiresInToSeconds(process.env.JWT_EXPIRES_IN);
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getAuthCookieMaxAgeSeconds(),
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getAuthTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value?.trim();
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.split(" ")[1]?.trim();
  return bearerToken || null;
}
