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
type OrderWithPayments = {
  id: string;
  number: string;
  userId: string | null;
  total: unknown;
  currency: string;
  payments: { id: string; provider: string }[];
};

/** Telcell callback currency code → our DB currency (WEB v1.2: AMD = 51) */
const TELCELL_CURRENCY_TO_OUR: Record<string, string> = { "51": "AMD", "֏": "AMD" };

/**
 * Resolve order from callback params. Doc: issuer_id = «код заказа в системе магазина».
 * We send issuer_id = base64(order.id). Telcell may echo back plain order id (not base64) — try id(raw) first.
 * Then id(decoded), number(decoded), number(raw). Fallback: sum + currency (51 → AMD).
 */
async function findOrderByTelcellCallback(
  issuerIdRaw: string,
  sum: string,
  currency: string
): Promise<OrderWithPayments | null> {
  const decoded = decodeIssuerId(issuerIdRaw);
  const orderCurrency = TELCELL_CURRENCY_TO_OUR[currency] ?? currency;

  const byIdRaw = await db.order.findFirst({
    where: { id: issuerIdRaw },
    include: { payments: true },
  });
  if (byIdRaw) return byIdRaw as OrderWithPayments;

  const byIdDecoded = await db.order.findFirst({
    where: { id: decoded },
    include: { payments: true },
  });
  if (byIdDecoded) return byIdDecoded as OrderWithPayments;

  const byNumberDecoded = await db.order.findFirst({
    where: { number: decoded },
    include: { payments: true },
  });
  if (byNumberDecoded) return byNumberDecoded as OrderWithPayments;

  if (issuerIdRaw !== decoded) {
    const byNumberRaw = await db.order.findFirst({
      where: { number: issuerIdRaw },
      include: { payments: true },
    });
    if (byNumberRaw) return byNumberRaw as OrderWithPayments;
  }

  const sumNum = parseFloat(sum);
  if (Number.isFinite(sumNum) && orderCurrency) {
    const pending = await db.order.findMany({
      where: {
        paymentStatus: "pending",
        currency: orderCurrency,
        total: sumNum,
        payments: {
          some: { provider: PAYMENT_PROVIDER, status: "pending" },
        },
      },
      include: { payments: true },
    });
    if (pending.length === 1) return pending[0] as OrderWithPayments;
  }
  return null;
}

export async function handleTelcellResult(params: Record<string, string>): Promise<void> {
  const config = getConfig();
  const issuerIdRaw = params.issuer_id ?? "";
  const status = (params.status ?? "").trim();
  const invoice = params.invoice ?? "";
  const paymentId = params.payment_id ?? "";
  const buyer = params.buyer ?? "";
  const currency = params.currency ?? "";
  const sum = params.sum ?? "";
  const time = params.time ?? "";
  const checksum = params.checksum ?? "";

  if (!issuerIdRaw || !checksum) {
    throw new Error("Missing issuer_id or checksum");
  }

  const isValid = verifyTelcellResultChecksum(
    config.shopKey,
    invoice,
    issuerIdRaw,
    paymentId,
    buyer,
    currency,
    sum,
    time,
    status,
    checksum
  );
  if (!isValid) {
    throw new Error("Telcell checksum invalid");
  }

  const order = await findOrderByTelcellCallback(issuerIdRaw, sum, currency);
  if (!order) {
    console.error("[telcell_result] Order not found. Callback params:", {
      issuer_id: issuerIdRaw,
      invoice,
      status,
      sum,
      currency,
    });
    throw new Error("Order not found");
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
