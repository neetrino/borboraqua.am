import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminSendPasswordReset } from "@/lib/services/password-reset.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    await adminSendPasswordReset(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const err = error as { status?: number; type?: string; title?: string; detail?: string; message?: string };
    const status = err.status ?? 500;
    console.error("❌ [ADMIN] Send password reset error:", error);
    return NextResponse.json(
      {
        type: err.type ?? "https://api.shop.am/problems/internal-error",
        title: err.title ?? "Internal Server Error",
        status,
        detail: err.detail ?? err.message ?? "An error occurred",
        instance: req.url,
      },
      { status }
    );
  }
}
