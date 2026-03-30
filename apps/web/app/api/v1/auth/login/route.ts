import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { validateOrigin } from "@/lib/csrf";
import { parseBody, loginBodySchema } from "@/lib/validate";
import { safeErrorResponse } from "@/lib/api-error";
import { setAuthCookie } from "@/lib/auth-cookie";
import { logApi } from "@/lib/safe-log";

export async function POST(req: NextRequest) {
  const csrf = validateOrigin(req);
  if (csrf) return csrf;
  const parsed = await parseBody(req, loginBodySchema);
  if (parsed.error) return parsed.error;
  try {
    const result = await authService.login(parsed.data);
    const response = NextResponse.json({ user: result.user });
    setAuthCookie(response, result.token);
    return response;
  } catch (error: unknown) {
    const status = error && typeof error === "object" && "status" in error ? (error as { status: number }).status : 500;
    if (status >= 500) logApi("AUTH: Login error", { status }, req.headers.get("x-request-id"));
    return safeErrorResponse(req, error, {
      status,
      allowDetailInProd: status < 500 && error && typeof error === "object" && "detail" in error ? (error as { detail: string }).detail : undefined,
    });
  }
}

