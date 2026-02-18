import { NextRequest, NextResponse } from "next/server";
import { handleAmeriabankCallback } from "@/lib/payments/ameriabank/callback-handler";

const FAIL_REDIRECT =
  (process.env.APP_URL?.replace(/\/$/, "") || "https://borboraqua.am") +
  "/checkout/error";

/**
 * GET /wc-api/ameriabank_successful
 * Bank redirects here (BackURL) with query: orderID, resposneCode, paymentID, opaque.
 * Verify via GetPaymentDetails, update order, redirect to success/fail page.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  try {
    const result = await handleAmeriabankCallback(searchParams);
    return NextResponse.redirect("redirect" in result ? result.redirect : FAIL_REDIRECT + "?reason=error");
  } catch (err) {
    console.error("[wc-api/ameriabank_successful]", err);
    return NextResponse.redirect(`${FAIL_REDIRECT}?reason=error`);
  }
}
