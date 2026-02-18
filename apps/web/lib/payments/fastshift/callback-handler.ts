import { db } from "@white-shop/db";
import type { FastshiftCallbackParams } from "./types";
import {
  FASTSHIFT_STATUS_SUCCESS,
  FASTSHIFT_ORDER_STATUS_COMPLETED,
  FASTSHIFT_GUID_REGEX,
} from "./constants";
import { getOrderStatus } from "./client";

const PAYMENT_PROVIDER = "fastshift";

function isSuccessStatus(status: string): boolean {
  const s = (status ?? "").trim();
  return FASTSHIFT_STATUS_SUCCESS.some((v) => v === s);
}

function isValidGuid(value: string): boolean {
  return value.length <= 36 && FASTSHIFT_GUID_REGEX.test(value.trim());
}

/**
 * Resolve order status from FastShift API (source of truth); fallback to callback params if API fails.
 */
async function resolveStatus(
  orderNumberGuid: string,
  callbackStatus: string
): Promise<{ status: string; fromApi: boolean }> {
  const api = await getOrderStatus(orderNumberGuid);
  if (api?.status) {
    return { status: api.status, fromApi: true };
  }
  return { status: (callbackStatus ?? "").trim(), fromApi: false };
}

/**
 * Handle callback from FastShift (user redirect or webhook).
 * - Verifies status via FastShift API when possible (secure).
 * - Idempotent: if order already paid, returns success without duplicate updates.
 * - Order identified by: 1) "order" (our number from callback_url), 2) "order_number" (GUID) via Payment.providerTransactionId.
 */
export async function handleFastshiftResponse(
  params: FastshiftCallbackParams
): Promise<{ orderNumber: string; success: boolean }> {
  const ourOrderNumber = (params.order ?? "").trim().slice(0, 64);
  const fastshiftOrderNumber = (params.order_number ?? params.orderNumber ?? "").trim();
  const callbackStatus = (params.status ?? "").trim();

  if (!ourOrderNumber && !fastshiftOrderNumber) {
    throw new Error("Missing order identifier");
  }
  if (fastshiftOrderNumber && !isValidGuid(fastshiftOrderNumber)) {
    throw new Error("Invalid order_number format");
  }

  let order: {
    id: string;
    number: string;
    paymentStatus: string;
    userId: string | null;
    payments: { id: string; provider: string; providerTransactionId: string | null }[];
  } | null = null;

  if (ourOrderNumber) {
    order = await db.order.findFirst({
      where: { number: ourOrderNumber },
      include: { payments: true },
    });
  }
  if (!order && fastshiftOrderNumber) {
    const payment = await db.payment.findFirst({
      where: {
        provider: PAYMENT_PROVIDER,
        providerTransactionId: fastshiftOrderNumber,
      },
      include: { order: { include: { payments: true } } },
    });
    if (payment?.order) {
      order = payment.order as typeof order;
    }
  }

  if (!order) {
    throw new Error("Order not found");
  }

  const payment = order.payments.find((p) => p.provider === PAYMENT_PROVIDER);
  const orderGuid =
    payment?.providerTransactionId != null
      ? payment.providerTransactionId
      : fastshiftOrderNumber
        ? fastshiftOrderNumber
        : null;

  if (order.paymentStatus === "paid") {
    return { orderNumber: order.number, success: true };
  }

  const { status: resolvedStatus, fromApi } = orderGuid
    ? await resolveStatus(orderGuid, callbackStatus)
    : { status: callbackStatus, fromApi: false };

  const success = resolvedStatus === FASTSHIFT_ORDER_STATUS_COMPLETED || isSuccessStatus(resolvedStatus);

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
                providerResponse: {
                  callbackStatus,
                  resolvedStatus,
                  fromApi,
                } as unknown as object,
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
            status: resolvedStatus,
            fromApi,
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
                errorCode: resolvedStatus || "unknown",
                providerResponse: {
                  callbackStatus,
                  resolvedStatus,
                  fromApi,
                } as unknown as object,
              },
            }),
          ]
        : []),
      db.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment_failed",
          data: {
            provider: PAYMENT_PROVIDER,
            status: resolvedStatus,
            order_number: order.number,
          },
        },
      }),
    ]);
  }

  return { orderNumber: order.number, success };
}
