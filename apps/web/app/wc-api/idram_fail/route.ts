import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.APP_URL?.replace(/\/$/, "") || "https://borboraqua.am";

/**
 * GET /wc-api/idram_fail
 * Idram redirects user here on payment fail or when precheck did not return OK.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const order = searchParams.get("order_number") ?? searchParams.get("order") ?? "";
  const redirect = order
    ? `${BASE_URL}/checkout/error?order=${encodeURIComponent(order)}&reason=declined`
    : `${BASE_URL}/checkout/error?reason=declined`;
  return NextResponse.redirect(redirect);
}
