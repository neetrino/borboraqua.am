import { NextRequest, NextResponse } from "next/server";
import { validateOrigin } from "@/lib/csrf";
import { parseBody, forgotPasswordBodySchema } from "@/lib/validate";
import { requestPasswordReset } from "@/lib/services/password-reset.service";
import { safeErrorResponse } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  const csrf = validateOrigin(req);
  if (csrf) return csrf;
  const parsed = await parseBody(req, forgotPasswordBodySchema);
  if (parsed.error) return parsed.error;
  try {
    await requestPasswordReset(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const status = error && typeof error === "object" && "status" in error ? (error as { status: number }).status : 500;
    if (status >= 500) console.error("❌ [AUTH] Forgot password error:", error);
    return safeErrorResponse(req, error, {
      status,
      allowDetailInProd: status < 500 && error && typeof error === "object" && "detail" in error ? (error as { detail: string }).detail : undefined,
    });
  }
}
