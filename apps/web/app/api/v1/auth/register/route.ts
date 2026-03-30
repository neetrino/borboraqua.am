import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { validateOrigin } from "@/lib/csrf";
import { parseBody, registerBodySchema } from "@/lib/validate";
import { safeErrorResponse } from "@/lib/api-error";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { setAuthCookie } from "@/lib/auth-cookie";
import { logApi } from "@/lib/safe-log";

export async function POST(req: NextRequest) {
  const retryAfter = checkRateLimit(req, RATE_LIMITS.AUTH_REGISTER_PER_MIN, "auth-register");
  if (retryAfter !== null) {
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/too-many-requests",
        title: "Too Many Requests",
        status: 429,
        detail: "Too many registration attempts. Please try again later.",
        instance: req.url,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  const csrf = validateOrigin(req);
  if (csrf) return csrf;
  const parsed = await parseBody(req, registerBodySchema);
  if (parsed.error) return parsed.error;
  try {
    const result = await authService.register(parsed.data);
    const response = NextResponse.json({ user: result.user }, { status: 201 });
    setAuthCookie(response, result.token);
    return response;
  } catch (error: unknown) {
    const status = error && typeof error === "object" && "status" in error ? (error as { status: number }).status : 500;
    if (status >= 500) logApi("AUTH: Registration error", { status }, req.headers.get("x-request-id"));
    return safeErrorResponse(req, error, {
      status,
      allowDetailInProd: status < 500 && error && typeof error === "object" && "detail" in error ? (error as { detail: string }).detail : undefined,
    });
  }
}

