import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";
import {
  isFastshiftConfigured,
  registerOrder,
  generateFastshiftOrderGuid,
  getConfig,
} from "@/lib/payments/fastshift";
import { parseBody, fastshiftInitBodySchema } from "@/lib/validate";
import { validateOrigin } from "@/lib/csrf";

const PAYMENT_PROVIDER = "fastshift";

/**
 * POST /api/v1/payments/fastshift/init
 * Body: { orderNumber: string }
 * Returns: { redirectUrl: string } — redirect user to FastShift to pay.
 */
export async function POST(req: NextRequest) {
  const csrf = validateOrigin(req);
  if (csrf) return csrf;

  try {
    if (!isFastshiftConfigured()) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/config-error",
          title: "Payment not configured",
          status: 503,
          detail: "FastShift payment is not configured",
          instance: req.url,
        },
        { status: 503 }
      );
    }

    const parsed = await parseBody(req, fastshiftInitBodySchema);
    if (parsed.error) return parsed.error;
    const orderNumber = parsed.data.orderNumber;

    const order = await db.order.findFirst({
      where: { number: orderNumber },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/not-found",
          title: "Order not found",
          status: 404,
          detail: "Order not found",
          instance: req.url,
        },
        { status: 404 }
      );
    }

    if (order.paymentStatus !== "pending") {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Invalid state",
          status: 400,
          detail: "Order is already paid or cancelled",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const payment = order.payments.find(
      (p) => p.provider === PAYMENT_PROVIDER && p.status === "pending"
    );
    if (!payment) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Payment not found",
          status: 400,
          detail: "No pending FastShift payment for this order",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const total = Number(order.total);
    if (Number.isNaN(total) || total <= 0) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Invalid amount",
          status: 400,
          detail: "Order total is invalid",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.APP_URL?.replace(/\/$/, "") || "https://borboraqua.am";
    const orderGuid = generateFastshiftOrderGuid();
    const callbackUrl = `${baseUrl}/wc-api/fastshift_response?order=${encodeURIComponent(order.number)}`;
    const webhookUrl = callbackUrl;

    const config = getConfig();
    console.info("[payments/fastshift/init] mode=%s callback=%s tokenLen=%d", config.isTest ? "test" : "live", callbackUrl, config.token?.length ?? 0);

    const { redirectUrl, orderNumber: fastshiftOrderNumber } = await registerOrder({
      order_number: orderGuid,
      amount: Math.round(total),
      description: `Order ${order.number}`,
      callback_url: callbackUrl,
      webhook_url: webhookUrl,
      external_order_id: order.id,
    });

    await db.payment.update({
      where: { id: payment.id },
      data: { providerTransactionId: fastshiftOrderNumber ?? orderGuid },
    });

    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("[payments/fastshift/init]", err);
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        status: 500,
        detail: err instanceof Error ? err.message : "Payment init failed",
        instance: req.url,
      },
      { status: 500 }
    );
  }
}
