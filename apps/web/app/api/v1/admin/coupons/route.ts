import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { couponsService } from "@/lib/services/coupons.service";

function forbidden(req: NextRequest) {
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

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return forbidden(req);
    }

    const result = await couponsService.getAdminCoupons();
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, req);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return forbidden(req);
    }

    const body = await req.json();
    const created = await couponsService.createCoupon({
      name: body.name,
      code: body.code,
      expiresAt: body.expiresAt,
      quantity: Number(body.quantity),
      isActive: body.isActive !== false,
      discountType: body.discountType,
      discountValue: Number(body.discountValue),
      singleUse: body.singleUse !== false,
      userIds: Array.isArray(body.userIds) ? body.userIds : [],
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error, req);
  }
}

