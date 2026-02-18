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
 * Params: status, order_number (our order number).
 * Updates order/payment; clears cart on success.
 */
export async function handleFastshiftResponse(
  params: FastshiftCallbackParams
): Promise<void> {
  const orderNumber = (params.order_number ?? params.orderNumber ?? "").trim();
  const status = (params.status ?? "").trim();

  if (!orderNumber) {
    throw new Error("Missing order_number");
  }

  const order = await db.order.findFirst({
    where: { number: orderNumber },
    include: { payments: true },
  });

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
            order_number: orderNumber,
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
          data: { provider: PAYMENT_PROVIDER, status, order_number: orderNumber },
        },
      }),
    ]);
  }
}
