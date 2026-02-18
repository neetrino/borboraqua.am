import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";
import {
  initPayment,
  buildPayPageUrl,
  isInitSuccess,
  getConfig,
  isAmeriaConfigured,
  toAmeriaOrderId,
  AMERIA_CURRENCY_MAP,
} from "@/lib/payments/ameriabank";

const PAYMENT_PROVIDER = "ameriabank";

/**
 * POST /api/v1/payments/ameriabank/init
 * Body: { orderNumber: string, lang?: string }
 * Returns: { redirectUrl: string } — redirect user to this URL for payment.
 * API doc: InitPayment, then redirect to Pay page.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAmeriaConfigured()) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/config-error",
          title: "Payment not configured",
          status: 503,
          detail: "Ameriabank payment is not configured",
          instance: req.url,
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const orderNumber =
      typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    const lang =
      typeof body.lang === "string" && /^[a-z]{2}$/i.test(body.lang)
        ? body.lang
        : "en";

    if (!orderNumber) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "orderNumber is required",
          instance: req.url,
        },
        { status: 400 }
      );
    }

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
          detail: "No pending Ameriabank payment for this order",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.APP_URL?.replace(/\/$/, "") || "https://borboraqua.am";
    const backUrl = `${baseUrl}/wc-api/ameriabank_successful`;

    const currencyCode =
      AMERIA_CURRENCY_MAP[order.currency] || AMERIA_CURRENCY_MAP.AMD;
    const ameriaOrderId = toAmeriaOrderId(order.id);

    const initRes = await initPayment({
      OrderID: ameriaOrderId,
      Amount: order.total,
      Currency: currencyCode,
      Description: `Order ${order.number}`,
      BackURL: backUrl,
      Opaque: order.id,
      lang: lang === "hy" ? "am" : lang === "ru" ? "ru" : "en",
    });

    if (!isInitSuccess(initRes) || !initRes.PaymentID) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/payment-error",
          title: "Payment init failed",
          status: 402,
          detail:
            initRes.ResponseMessage || "Ameriabank init failed",
          instance: req.url,
        },
        { status: 402 }
      );
    }

    await db.payment.update({
      where: { id: payment.id },
      data: { providerTransactionId: initRes.PaymentID },
    });

    const redirectUrl = buildPayPageUrl(initRes.PaymentID, lang === "hy" ? "am" : lang);
    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("[payments/ameriabank/init]", err);
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
