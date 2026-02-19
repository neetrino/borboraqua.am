import { db } from "@white-shop/db";
import { getConfig } from "./config";
import { verifyTelcellResultChecksum } from "./security";
import { TELCELL_STATUS_PAID } from "./constants";
import { printReceiptForOrder } from "@/lib/payments/ehdm";

const PAYMENT_PROVIDER = "telcell";

function decodeIssuerId(issuerId: string): string {
  try {
    const decoded = Buffer.from(issuerId, "base64").toString("utf8");
    if (decoded && decoded.length > 0) return decoded;
  } catch {
    // ignore
  }
  return issuerId;
}

/**
 * Handle RESULT_URL callback from Telcell.
 * Params: issuer_id, status, invoice, payment_id, currency, sum, time, checksum.
 * Checksum = MD5(shop_key + invoice + issuer_id + payment_id + currency + sum + time + status).
 * Returns nothing; updates order/payment in DB. Throw on invalid checksum.
 */
export async function handleTelcellResult(params: Record<string, string>): Promise<void> {
  const config = getConfig();
  const issuerIdRaw = params.issuer_id ?? "";
  const orderId = decodeIssuerId(issuerIdRaw);
  const status = (params.status ?? "").trim();
  const invoice = params.invoice ?? "";
  const paymentId = params.payment_id ?? "";
  const currency = params.currency ?? "";
  const sum = params.sum ?? "";
  const time = params.time ?? "";
  const checksum = params.checksum ?? "";

  if (!orderId || !checksum) {
    throw new Error("Missing issuer_id or checksum");
  }

  const isValid = verifyTelcellResultChecksum(
    config.shopKey,
    invoice,
    issuerIdRaw,
    paymentId,
    currency,
    sum,
    time,
    status,
    checksum
  );
  if (!isValid) {
    throw new Error("Telcell checksum invalid");
  }

  const order = await db.order.findFirst({
    where: { id: orderId },
    include: { payments: true },
  });
  if (!order) {
    const byNumber = await db.order.findFirst({ where: { number: orderId }, include: { payments: true } });
    if (!byNumber) throw new Error("Order not found");
    await updateOrderPayment(byNumber, status, paymentId, params);
    return;
  }
  await updateOrderPayment(order, status, paymentId, params);
}

async function updateOrderPayment(
  order: { id: string; number: string; userId: string | null; payments: { id: string; provider: string }[] },
  status: string,
  providerTransactionId: string,
  rawParams: Record<string, string>
): Promise<void> {
  const payment = order.payments.find((p) => p.provider === PAYMENT_PROVIDER);
  const isPaid = status === TELCELL_STATUS_PAID;

  if (isPaid) {
    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: { paymentStatus: "paid", status: "confirmed", paidAt: new Date() },
      }),
      ...(payment
        ? [
            db.payment.update({
              where: { id: payment.id },
              data: {
                status: "completed",
                completedAt: new Date(),
                providerTransactionId,
                providerResponse: rawParams as unknown as object,
              },
            }),
          ]
        : []),
      db.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment_completed",
          data: { provider: PAYMENT_PROVIDER, paymentId: providerTransactionId, status },
        },
      }),
    ]);
    if (order.userId) {
      await db.cart.deleteMany({ where: { userId: order.userId } });
    }
    printReceiptForOrder(order.id).catch((err) =>
      console.error("[EHDM] printReceiptForOrder", err)
    );
  } else {
    await db.$transaction([
      db.order.update({ where: { id: order.id }, data: { paymentStatus: "failed" } }),
      ...(payment
        ? [
            db.payment.update({
              where: { id: payment.id },
              data: {
                status: "failed",
                failedAt: new Date(),
                errorCode: status,
                providerResponse: rawParams as unknown as object,
              },
            }),
          ]
        : []),
      db.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment_failed",
          data: { provider: PAYMENT_PROVIDER, status },
        },
      }),
    ]);
  }
}
