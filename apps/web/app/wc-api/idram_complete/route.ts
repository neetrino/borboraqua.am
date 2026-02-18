import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.APP_URL?.replace(/\/$/, "") || "https://borboraqua.am";

/**
 * GET /wc-api/idram_complete
 * Idram redirects user here on success. Optional query: order_number or order (from form).
 * Redirect to checkout success page.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const order = searchParams.get("order_number") ?? searchParams.get("order") ?? "";
  const redirect = order
    ? `${BASE_URL}/checkout/success?order=${encodeURIComponent(order)}`
    : `${BASE_URL}/checkout/success`;
  return NextResponse.redirect(redirect);
}
