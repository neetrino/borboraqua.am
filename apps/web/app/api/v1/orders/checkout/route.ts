import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { ordersService } from "@/lib/services/orders.service";
import { getIdempotentResponse, setIdempotentResponse } from "@/lib/idempotency";
import { safeErrorResponse } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  const idemKey = req.headers.get("Idempotency-Key");
  if (idemKey && idemKey.length <= 128) {
    const cached = getIdempotentResponse(idemKey);
    if (cached) return NextResponse.json(cached.body, { status: cached.status });
  }

  try {
    const user = await authenticateToken(req);
    const data = await req.json();

    const result = await ordersService.checkout(data, user?.id);

    if (idemKey && idemKey.length <= 128) {
      setIdempotentResponse(idemKey, result, 201);
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const status = error && typeof error === "object" && "status" in error ? (error as { status: number }).status : 500;
    if (status >= 500) {
      console.error("❌ [ORDERS API] Checkout error:", error);
    }
    return safeErrorResponse(req, error, {
      status,
      allowDetailInProd: status < 500 && error && typeof error === "object" && "detail" in error ? (error as { detail: string }).detail : undefined,
    });
  }
}

