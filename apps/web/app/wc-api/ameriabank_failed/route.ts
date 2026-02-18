import { NextRequest, NextResponse } from "next/server";
import { handleAmeriabankCallback } from "@/lib/payments/ameriabank/callback-handler";

const FAIL_REDIRECT =
  (process.env.APP_URL?.replace(/\/$/, "") || "https://borboraqua.am") +
  "/checkout/error";

/**
 * GET /wc-api/ameriabank_failed
 * Bank may redirect here on failure (if configured). Same logic: verify via GetPaymentDetails, then redirect.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  try {
    const result = await handleAmeriabankCallback(searchParams);
    return NextResponse.redirect("redirect" in result ? result.redirect : FAIL_REDIRECT + "?reason=error");
  } catch (err) {
    console.error("[wc-api/ameriabank_failed]", err);
    return NextResponse.redirect(`${FAIL_REDIRECT}?reason=error`);
  }
}
