import { NextRequest, NextResponse } from "next/server";
import { handleIdramResult } from "@/lib/payments/idram";

const TEXT_PLAIN = "text/plain; charset=utf-8";

/**
 * POST /wc-api/idram_result
 * Idram sends two POSTs (x-www-form-urlencoded):
 * (a) EDP_PRECHECK=YES — respond "OK" if order/amount valid.
 * (b) Payment confirmation with EDP_CHECKSUM — verify, update order, respond "OK".
 * Response must be plain text, no HTML.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const { body: responseBody } = await handleIdramResult(body);
    return new NextResponse(responseBody, {
      status: 200,
      headers: { "Content-Type": TEXT_PLAIN },
    });
  } catch (err) {
    console.error("[wc-api/idram_result]", err);
    return new NextResponse("Error", {
      status: 500,
      headers: { "Content-Type": TEXT_PLAIN },
    });
  }
}
