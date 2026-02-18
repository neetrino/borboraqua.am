import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";

const BASE_URL = process.env.APP_URL?.replace(/\/$/, "") || "https://borboraqua.am";

function decodeIssuerId(issuerId: string): string {
  try {
    const decoded = Buffer.from(issuerId, "base64").toString("utf8");
    if (decoded && decoded.length > 0) return decoded;
  } catch {
    // ignore
  }
  return issuerId;
}

/**
 * GET /wc-api/telcell_redirect
 * Telcell redirects user here after payment (REDIRECT_URL). Query: order or issuer_id.
 * Redirect to checkout success (or error if order not found).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderParam = searchParams.get("order");
  const issuerIdParam = searchParams.get("issuer_id");

  let orderNumber = "";
  if (orderParam) {
    const order = await db.order.findFirst({ where: { number: orderParam } });
    if (order) orderNumber = order.number;
    else {
      const byId = await db.order.findUnique({ where: { id: orderParam } });
      if (byId) orderNumber = byId.number;
    }
  } else if (issuerIdParam) {
    const orderId = decodeIssuerId(issuerIdParam);
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (order) orderNumber = order.number;
  }

  const redirect = orderNumber
    ? `${BASE_URL}/checkout/success?order=${encodeURIComponent(orderNumber)}`
    : `${BASE_URL}/checkout/success`;
  return NextResponse.redirect(redirect);
}
