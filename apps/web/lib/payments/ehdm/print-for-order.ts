import { db } from "@white-shop/db";
import { isEhdmConfigured } from "./config";
import { getNextSeqAndIncrement, decrementSeq } from "./seq";
import { buildPrintBody, callPrint } from "./print";

/**
 * Generate EHDM fiscal receipt for order (when order is paid).
 * Skips if EHDM not configured, order not AMD, or receipt already printed.
 * On API failure, seq is rolled back so it can be reused.
 */
export async function printReceiptForOrder(orderId: string): Promise<{
  ok: boolean;
  receiptId?: string;
  fiscal?: string;
  error?: string;
}> {
  if (!isEhdmConfigured()) {
    return { ok: false, error: "EHDM not configured" };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true, ehdmReceipt: true },
  });

  if (!order) {
    return { ok: false, error: "Order not found" };
  }
  if (order.currency !== "AMD") {
    return { ok: false, error: "EHDM only for AMD orders" };
  }
  if (order.ehdmReceipt) {
    return {
      ok: true,
      receiptId: String(order.ehdmReceipt.receiptId),
      fiscal: order.ehdmReceipt.fiscal ?? undefined,
    };
  }

  let seq: number;
  try {
    seq = await getNextSeqAndIncrement();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to get seq",
    };
  }

  const body = buildPrintBody(order, seq);

  try {
    const response = await callPrint(body);
    if (response.code !== 0 || response.error || !response.result) {
      await decrementSeq();
      return {
        ok: false,
        error: response.errorMessage ?? response.error ?? "EHDM print failed",
      };
    }

    const r = response.result;
    await db.ehdmReceipt.create({
      data: {
        orderId: order.id,
        receiptId: String(r.receiptId),
        seq,
        fiscal: r.fiscal,
        qr: r.qr,
        response: response as unknown as object,
      },
    });

    return {
      ok: true,
      receiptId: String(r.receiptId),
      fiscal: r.fiscal,
    };
  } catch (e) {
    await decrementSeq();
    return {
      ok: false,
      error: e instanceof Error ? e.message : "EHDM request failed",
    };
  }
}
