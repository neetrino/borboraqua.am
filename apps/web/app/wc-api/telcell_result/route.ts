import { NextRequest, NextResponse } from "next/server";
import { handleTelcellResult } from "@/lib/payments/telcell";

function getParams(req: NextRequest): Record<string, string> {
  const url = new URL(req.url);
  const fromQuery: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    fromQuery[key] = value;
  });
  if (Object.keys(fromQuery).length > 0) return fromQuery;
  return {};
}

/**
 * GET/POST /wc-api/telcell_result
 * Telcell sends payment status (RESULT_URL). Params: issuer_id, status, invoice, payment_id, currency, sum, time, checksum.
 * Verify checksum, update order, return 200.
 */
export async function GET(req: NextRequest) {
  try {
    const params = getParams(req);
    await handleTelcellResult(params);
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error("[wc-api/telcell_result]", err);
    return new NextResponse(null, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let params: Record<string, string> = {};
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const body = await req.text();
      for (const part of body.split("&")) {
        const eq = part.indexOf("=");
        const key = eq >= 0 ? decodeURIComponent(part.slice(0, eq).replace(/\+/g, " ")) : "";
        const value = eq >= 0 ? decodeURIComponent(part.slice(eq + 1).replace(/\+/g, " ")) : "";
        if (key) params[key] = value;
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      params = typeof body === "object" && body !== null ? (body as Record<string, string>) : {};
    }
    if (Object.keys(params).length === 0) params = getParams(req);
    await handleTelcellResult(params);
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error("[wc-api/telcell_result]", err);
    return new NextResponse(null, { status: 400 });
  }
}
