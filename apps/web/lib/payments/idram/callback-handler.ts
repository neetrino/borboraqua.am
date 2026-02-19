import { db } from "@white-shop/db";
import { getConfig } from "./config";
import { verifyIdramChecksum } from "./checksum";
import { printReceiptForOrder } from "@/lib/payments/ehdm";

const PAYMENT_PROVIDER = "idram";

/** Parse form body (x-www-form-urlencoded) into Record. */
export function parseFormBody(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of body.split("&")) {
    const eq = part.indexOf("=");
    const key = eq >= 0 ? part.slice(0, eq) : part;
    const raw = eq >= 0 ? part.slice(eq + 1) : "";
    try {
      const value = decodeURIComponent(raw.replace(/\+/g, " "));
      if (key) out[key] = value;
    } catch {
      if (key) out[key] = raw;
    }
  }
  return out;
}

/**
 * (a) Precheck: validate order exists and amount matches. Return "OK" or error message.
 * Idram sends EDP_PRECHECK=YES, EDP_BILL_NO, EDP_REC_ACCOUNT, EDP_AMOUNT.
 */
export async function handleIdramPrecheck(
  params: Record<string, string>
): Promise<{ body: string }> {
  const config = getConfig();
  if (params.EDP_REC_ACCOUNT !== config.recAccount) {
    return { body: "EDP_REC_ACCOUNT mismatch" };
  }
  const billNo = params.EDP_BILL_NO?.trim();
  const amountParam = params.EDP_AMOUNT?.trim();
  if (!billNo || amountParam === undefined) {
    return { body: "EDP_BILL_NO or EDP_AMOUNT missing" };
  }
  const amount = parseFloat(amountParam);
  if (Number.isNaN(amount) || amount <= 0) {
    return { body: "EDP_AMOUNT invalid" };
  }

  const order = await db.order.findFirst({
    where: { number: billNo },
    include: { payments: true },
  });
  if (!order) {
    return { body: "EDP_BILL_NO not found" };
  }
  if (order.paymentStatus !== "pending") {
    return { body: "Order already processed" };
  }
  const orderTotal = Number(order.total);
  if (Math.abs(orderTotal - amount) > 0.01) {
    return { body: "EDP_AMOUNT mismatch" };
  }
  return { body: "OK" };
}

/**
 * (b) Payment confirmation: verify checksum, update order/payment, return "OK" or error.
 */
export async function handleIdramPaymentConfirm(
  params: Record<string, string>
): Promise<{ body: string }> {
  const config = getConfig();
  const billNo = params.EDP_BILL_NO?.trim();
  const recAccount = params.EDP_REC_ACCOUNT?.trim();
  const payerAccount = params.EDP_PAYER_ACCOUNT?.trim();
  const amount = params.EDP_AMOUNT?.trim();
  const transId = params.EDP_TRANS_ID?.trim();
  const transDate = params.EDP_TRANS_DATE?.trim();
  const checksum = params.EDP_CHECKSUM?.trim();

  if (!billNo || !recAccount || !amount || !transId || !transDate || !checksum) {
    return { body: "Missing required fields" };
  }
  if (recAccount !== config.recAccount) {
    return { body: "EDP_REC_ACCOUNT mismatch" };
  }
  if (!verifyIdramChecksum(recAccount, amount, config.secretKey, billNo, payerAccount ?? "", transId, transDate, checksum)) {
    return { body: "EDP_CHECKSUM not correct" };
  }

  const order = await db.order.findFirst({
    where: { number: billNo },
    include: { payments: true },
  });
  if (!order) {
    return { body: "EDP_BILL_NO not found" };
  }
  const orderTotal = Number(order.total);
  const amountNum = parseFloat(amount);
  if (Number.isNaN(amountNum) || Math.abs(orderTotal - amountNum) > 0.01) {
    return { body: "EDP_AMOUNT mismatch" };
  }
  if (order.paymentStatus !== "pending") {
    return { body: "OK" };
  }

  const payment = order.payments.find((p) => p.provider === PAYMENT_PROVIDER);
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
              providerTransactionId: transId,
              providerResponse: {
                EDP_PAYER_ACCOUNT: payerAccount,
                EDP_TRANS_ID: transId,
                EDP_TRANS_DATE: transDate,
                EDP_AMOUNT: amount,
              } as object,
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
          EDP_TRANS_ID: transId,
          EDP_PAYER_ACCOUNT: payerAccount,
        },
      },
    }),
  ]);
  if (order.userId) {
    await db.cart.deleteMany({ where: { userId: order.userId } });
  }
  printReceiptForOrder(order.id).catch((err) =>
    console.error("[EHDM] printReceiptForOrder", err)
  );
  return { body: "OK" };
}

/**
 * Handle RESULT_URL POST body. Either precheck (EDP_PRECHECK=YES) or payment confirmation.
 * Returns response body to send (plain text, no HTML).
 */
export async function handleIdramResult(body: string): Promise<{ body: string }> {
  const params = parseFormBody(body);
  if (params.EDP_PRECHECK === "YES") {
    return handleIdramPrecheck(params);
  }
  if (
    params.EDP_BILL_NO &&
    params.EDP_REC_ACCOUNT &&
    params.EDP_AMOUNT &&
    params.EDP_TRANS_ID &&
    params.EDP_CHECKSUM
  ) {
    return handleIdramPaymentConfirm(params);
  }
  return { body: "Unknown request" };
}
