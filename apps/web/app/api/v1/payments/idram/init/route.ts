import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";
import { isIdramConfigured, buildIdramFormData } from "@/lib/payments/idram";

const PAYMENT_PROVIDER = "idram";

/**
 * POST /api/v1/payments/idram/init
 * Body: { orderNumber: string, lang?: string }
 * Returns: { formAction: string, formData: Record<string, string> } — submit form to formAction.
 * Idram accepts only AMD; form is POST to https://banking.idram.am/Payment/GetPayment.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isIdramConfigured()) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/config-error",
          title: "Payment not configured",
          status: 503,
          detail: "Idram payment is not configured",
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

    if (order.currency !== "AMD") {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Invalid currency",
          status: 400,
          detail: "Idram accepts only AMD",
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
          detail: "No pending Idram payment for this order",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const amount = Number(order.total);
    if (Number.isNaN(amount) || amount <= 0) {
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

    const { formAction, formData } = buildIdramFormData({
      orderNumber: order.number,
      amount,
      description: `Order ${order.number}`,
      lang: lang === "hy" ? "am" : lang,
      email: order.customerEmail ?? undefined,
    });

    return NextResponse.json({ formAction, formData });
  } catch (err) {
    console.error("[payments/idram/init]", err);
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
