import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { validateOrigin } from "@/lib/csrf";
import { parseBody, loginBodySchema } from "@/lib/validate";
import { safeErrorResponse } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  const csrf = validateOrigin(req);
  if (csrf) return csrf;
  const parsed = await parseBody(req, loginBodySchema);
  if (parsed.error) return parsed.error;
  try {
    const result = await authService.login(parsed.data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const status = error && typeof error === "object" && "status" in error ? (error as { status: number }).status : 500;
    if (status >= 500) console.error("❌ [AUTH] Login error:", error);
    return safeErrorResponse(req, error, {
      status,
      allowDetailInProd: status < 500 && error && typeof error === "object" && "detail" in error ? (error as { detail: string }).detail : undefined,
    });
  }
}

