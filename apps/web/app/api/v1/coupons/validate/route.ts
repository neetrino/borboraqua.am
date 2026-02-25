import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { couponsService } from "@/lib/services/coupons.service";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Login is required to use a personal coupon",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const code = typeof body.code === "string" ? body.code : "";
    const subtotal = Number(body.subtotal) || 0;
    const result = await couponsService.validateForUser({
      code,
      userId: user.id,
      subtotal,
    });

    return NextResponse.json({ data: result });
  } catch (error: unknown) {
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
}

