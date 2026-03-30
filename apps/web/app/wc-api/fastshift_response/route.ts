import { NextRequest, NextResponse } from "next/server";
import { handleFastshiftResponse } from "@/lib/payments/fastshift";
import type { FastshiftCallbackParams } from "@/lib/payments/fastshift";
import { verifyWebhookSignature, isReplay } from "@/lib/webhook-verify";
import { getConfig } from "@/lib/payments/fastshift/config";

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

function getSignatureHeader(req: NextRequest): string | null {
  return (
    req.headers.get("x-signature") ??
    req.headers.get("x-fastshift-signature") ??
    req.headers.get("x-webhook-signature")
  );
}

function parseTimestampMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  // Accept seconds or milliseconds from providers/proxies.
  return parsed > 1e12 ? parsed : parsed * 1000;
}

/**
 * GET /wc-api/fastshift_response
 * User redirect from FastShift with status, order_number (query).
 * On error: redirect to checkout (no leak of internal errors).
 */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.APP_URL?.replace(/\/$/, "") || "https://borboraqua.am";
  try {
    const params = getQueryParams(req) as FastshiftCallbackParams;
    const { orderNumber, success } = await handleFastshiftResponse(params);
    if (success) {
      return NextResponse.redirect(`${baseUrl}/checkout/success?order=${encodeURIComponent(orderNumber)}`, 302);
    }
    return NextResponse.redirect(`${baseUrl}/checkout?order=${encodeURIComponent(orderNumber)}`, 302);
  } catch (err) {
    console.error("[wc-api/fastshift_response GET]", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.redirect(`${baseUrl}/checkout`, 302);
  }
}

/**
 * POST /wc-api/fastshift_response
 * Webhook from FastShift (JSON or form) with status, order_number.
 * Returns 200 on success; 400 on invalid request (no error body to avoid leaking internals).
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    const rawBody = await req.text();
    const signature = getSignatureHeader(req);
    const timestampMs = parseTimestampMs(req.headers.get("x-timestamp"));
    const { webhookSecret, webhookFailOpen } = getConfig();
    const enforceSignature = !webhookFailOpen;

    if (!webhookSecret) {
      if (enforceSignature) {
        console.error("[wc-api/fastshift_response POST] Missing FASTSHIFT_WEBHOOK_SECRET");
        return new NextResponse(null, { status: 503 });
      }
    } else {
      const signatureValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!signatureValid) {
        console.error("[wc-api/fastshift_response POST] Invalid signature");
        return new NextResponse(null, { status: 401 });
      }
    }

    let params: Record<string, string>;
    if (contentType.includes("application/json")) {
      const parsed = rawBody ? JSON.parse(rawBody) : {};
      params = toRecord(parsed);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      params = {};
      for (const part of rawBody.split("&")) {
        const eq = part.indexOf("=");
        const key = eq >= 0 ? decodeURIComponent(part.slice(0, eq).replace(/\+/g, " ")) : "";
        const value = eq >= 0 ? decodeURIComponent(part.slice(eq + 1).replace(/\+/g, " ")) : "";
        if (key) params[key] = value;
      }
    } else {
      params = getQueryParams(req);
    }
    const replayKey =
      req.headers.get("x-event-id") ||
      params.transaction_id ||
      params.payment_id ||
      params.order_number ||
      params.order ||
      null;

    if (replayKey && isReplay(replayKey, timestampMs)) {
      console.error("[wc-api/fastshift_response POST] Replay detected");
      return new NextResponse(null, { status: 409 });
    }

    await handleFastshiftResponse(params as FastshiftCallbackParams);
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error("[wc-api/fastshift_response POST]", err instanceof Error ? err.message : "Unknown error");
    return new NextResponse(null, { status: 400 });
  }
}
