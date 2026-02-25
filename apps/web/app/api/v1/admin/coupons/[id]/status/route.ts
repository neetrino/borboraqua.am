import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { couponsService } from "@/lib/services/coupons.service";

function errorResponse(error: unknown, req: NextRequest) {
  const e = error as { type?: string; title?: string; status?: number; detail?: string; message?: string };
  return NextResponse.json(
    {
      type: e.type || "https://api.shop.am/problems/internal-error",
      title: e.title || "Internal Server Error",
      status: e.status || 500,
      detail: e.detail || e.message || "An error occurred",
      instance: req.url,
    },
    { status: e.status || 500 }
  );
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;
    const body = await req.json();
    const isActive = Boolean(body.isActive);
    const updated = await couponsService.setCouponStatus(id, isActive);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return errorResponse(error, req);
  }
}

