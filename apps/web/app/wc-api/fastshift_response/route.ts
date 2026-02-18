import { NextRequest, NextResponse } from "next/server";
import { handleFastshiftResponse } from "@/lib/payments/fastshift";
import type { FastshiftCallbackParams } from "@/lib/payments/fastshift";

function toRecord(obj: unknown): Record<string, string> {
  if (typeof obj !== "object" || obj === null) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") out[k] = v;
    else if (v != null) out[k] = String(v);
  }
  return out;
}

function getQueryParams(req: NextRequest): Record<string, string> {
  const url = new URL(req.url);
  const out: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

/**
 * GET /wc-api/fastshift_response
 * User redirect from FastShift with status, order_number (query).
 */
export async function GET(req: NextRequest) {
  try {
    const params = getQueryParams(req) as FastshiftCallbackParams;
    const { orderNumber, success } = await handleFastshiftResponse(params);
    const baseUrl = process.env.APP_URL?.replace(/\/$/, "") || "https://borboraqua.am";
    if (success) {
      return NextResponse.redirect(`${baseUrl}/checkout/success?order=${encodeURIComponent(orderNumber)}`, 302);
    }
    return NextResponse.redirect(`${baseUrl}/checkout?order=${encodeURIComponent(orderNumber)}`, 302);
  } catch (err) {
    console.error("[wc-api/fastshift_response GET]", err);
    return new NextResponse(null, { status: 400 });
  }
}

/**
 * POST /wc-api/fastshift_response
 * Webhook from FastShift (JSON or form) with status, order_number.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let params: Record<string, string>;
    if (contentType.includes("application/json")) {
      const body = await req.json();
      params = toRecord(body);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const body = await req.text();
      params = {};
      for (const part of body.split("&")) {
        const eq = part.indexOf("=");
        const key = eq >= 0 ? decodeURIComponent(part.slice(0, eq).replace(/\+/g, " ")) : "";
        const value = eq >= 0 ? decodeURIComponent(part.slice(eq + 1).replace(/\+/g, " ")) : "";
        if (key) params[key] = value;
      }
    } else {
      params = getQueryParams(req);
    }
    await handleFastshiftResponse(params as FastshiftCallbackParams);
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error("[wc-api/fastshift_response POST]", err);
    return new NextResponse(null, { status: 400 });
  }
}
