import { db } from "@white-shop/db";
import { getPaymentDetails } from "./client";
import {
  AMERIA_PAYMENT_SUCCESS_RESPONSE_CODE,
  AMERIA_PAYMENT_STATE_SUCCESSFUL,
  AMERIA_ORDER_STATUS_DEPOSITED,
} from "./constants";

const PAYMENT_PROVIDER = "ameriabank";

export type CallbackResult =
  | { redirect: string }
  | { error: string };

/**
 * Process BackURL callback from Ameriabank (GET with orderID, resposneCode, paymentID, opaque).
 * Returns redirect URL for success or fail page.
 */
export async function handleAmeriabankCallback(searchParams: URLSearchParams): Promise<CallbackResult> {
  const paymentID = searchParams.get("paymentID");
  const resposneCode = searchParams.get("resposneCode");
  const opaque = searchParams.get("opaque");

  const baseUrl =
    process.env.APP_URL?.replace(/\/$/, "") || "https://borboraqua.am";
  const successRedirect = `${baseUrl}/checkout/success`;
  const failRedirect = `${baseUrl}/checkout/error`;

  if (!paymentID || !opaque) {
    return { redirect: `${failRedirect}?reason=missing_params` };
  }

  const order = await db.order.findUnique({
    where: { id: opaque },
    include: { payments: true },
  });

  if (!order) {
    return { redirect: `${failRedirect}?reason=order_not_found` };
  }

  const details = await getPaymentDetails(paymentID);
  const isSuccess =
    details.ResponseCode === AMERIA_PAYMENT_SUCCESS_RESPONSE_CODE &&
    (details.PaymentState === AMERIA_PAYMENT_STATE_SUCCESSFUL ||
      details.OrderStatus === AMERIA_ORDER_STATUS_DEPOSITED);

  const payment = order.payments.find(
    (p) => p.provider === PAYMENT_PROVIDER
  );

  if (isSuccess) {
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
                providerTransactionId: paymentID,
                cardLast4: details.CardNumber?.slice(-4) ?? null,
                providerResponse: details as unknown as object,
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
            paymentID,
            responseCode: details.ResponseCode,
          },
        },
      }),
    ]);
    if (order.userId) {
      await db.cart.deleteMany({ where: { userId: order.userId } });
    }
    return {
      redirect: `${successRedirect}?order=${encodeURIComponent(order.number)}`,
    };
  }

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
              errorCode: resposneCode ?? details.ResponseCode ?? undefined,
              errorMessage: details.ResponseCode ?? undefined,
              providerResponse: details as unknown as object,
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
          paymentID,
          responseCode: resposneCode ?? details.ResponseCode,
        },
      },
    }),
  ]);
  return {
    redirect: `${failRedirect}?order=${encodeURIComponent(order.number)}&reason=declined`,
  };
}
