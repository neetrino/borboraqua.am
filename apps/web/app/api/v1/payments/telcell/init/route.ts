import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";
import { isTelcellConfigured, buildTelcellRedirectUrl, TELCELL_LANG_MAP } from "@/lib/payments/telcell";

const PAYMENT_PROVIDER = "telcell";

/**
 * POST /api/v1/payments/telcell/init
 * Body: { orderNumber: string, lang?: string }
 * Returns: { redirectUrl: string } — redirect user to Telcell to pay.
 * Telcell accepts only AMD.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isTelcellConfigured()) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/config-error",
          title: "Payment not configured",
          status: 503,
          detail: "Telcell payment is not configured",
          instance: req.url,
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    const lang = typeof body.lang === "string" && /^[a-z]{2}$/i.test(body.lang) ? body.lang : "en";

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
        { type: "https://api.shop.am/problems/not-found", title: "Order not found", status: 404, detail: "Order not found", instance: req.url },
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

    if (order.currency !== "AMD") {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Invalid currency",
          status: 400,
          detail: "Telcell accepts only AMD",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const payment = order.payments.find((p) => p.provider === PAYMENT_PROVIDER && p.status === "pending");
    if (!payment) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Payment not found",
          status: 400,
          detail: "No pending Telcell payment for this order",
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

    const langParam = TELCELL_LANG_MAP[lang] ?? "am";
    const redirectUrl = buildTelcellRedirectUrl({
      orderId: order.id,
      orderTotal: total,
      productDescription: `Order ${order.number}`,
      validDays: 1,
      lang: langParam,
    });

    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("[payments/telcell/init]", err);
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
