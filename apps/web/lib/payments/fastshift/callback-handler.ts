import { db } from "@white-shop/db";
import type { FastshiftCallbackParams } from "./types";
import { FASTSHIFT_STATUS_SUCCESS } from "./constants";

const PAYMENT_PROVIDER = "fastshift";

function isSuccessStatus(status: string): boolean {
  const s = (status ?? "").trim();
  return FASTSHIFT_STATUS_SUCCESS.some((v) => v === s);
}

/**
 * Handle callback from FastShift (user redirect or webhook).
 * Order is identified by: 1) "order" (our order number from callback_url), or 2) "order_number" (GUID) via Payment.providerTransactionId.
 * See HK Agency payment-gateway-for-fastshift: they use GUID as order_number and order_id in callback URL.
 */
export async function handleFastshiftResponse(
  params: FastshiftCallbackParams
): Promise<{ orderNumber: string; success: boolean }> {
  const status = (params.status ?? "").trim();
  const ourOrderNumber = (params.order ?? "").trim();
  const fastshiftOrderNumber = (params.order_number ?? params.orderNumber ?? "").trim();

  let order: { id: string; number: string; userId: string | null; payments: { id: string; provider: string }[] } | null = null;

  if (ourOrderNumber) {
    order = await db.order.findFirst({
      where: { number: ourOrderNumber },
      include: { payments: true },
    });
  }
  if (!order && fastshiftOrderNumber) {
    const payment = await db.payment.findFirst({
      where: { provider: PAYMENT_PROVIDER, providerTransactionId: fastshiftOrderNumber },
      include: { order: { include: { payments: true } } },
    });
    if (payment?.order) order = payment.order as typeof order;
  }

  if (!order) {
    throw new Error("Order not found");
  }

  const payment = order.payments.find(
    (p) => p.provider === PAYMENT_PROVIDER
  );
  const success = isSuccessStatus(status);

  if (success) {
    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "paid",
          status: "confirmed",
          paidAt: new Date(),
        },
      }),
      ...(payment
        ? [
            db.payment.update({
              where: { id: payment.id },
              data: {
                status: "completed",
                completedAt: new Date(),
                providerTransactionId: params.transaction_id ?? params.payment_id ?? status,
                providerResponse: (params as unknown) as object,
              },
            }),
          ]
        : []),
      db.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment_completed",
          data: {
            provider: PAYMENT_PROVIDER,
            status,
            order_number: order.number,
          },
        },
      }),
    ]);
    if (order.userId) {
      await db.cart.deleteMany({ where: { userId: order.userId } });
    }
  } else {
    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: { paymentStatus: "failed" },
      }),
      ...(payment
        ? [
            db.payment.update({
              where: { id: payment.id },
              data: {
                status: "failed",
                failedAt: new Date(),
                errorCode: status,
                providerResponse: (params as unknown) as object,
              },
            }),
          ]
        : []),
      db.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment_failed",
          data: { provider: PAYMENT_PROVIDER, status, order_number: order.number },
        },
      }),
    ]);
  }

  return { orderNumber: order.number, success };
}
