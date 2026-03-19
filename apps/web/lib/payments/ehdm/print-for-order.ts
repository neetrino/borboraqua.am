import { db } from "@white-shop/db";
import { isEhdmConfigured } from "./config";
import { getNextSeqAndIncrement, decrementSeq } from "./seq";
import { buildPrintBody, callPrint } from "./print";

/** Максимум повторных попыток создания чека при сбое EHDM API. */
const EHDM_RECEIPT_MAX_ATTEMPTS = 3;
/** Задержка между попытками (мс). */
const EHDM_RECEIPT_RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate EHDM fiscal receipt for order (when order is paid).
 * Skips if EHDM not configured, order not AMD, or receipt already printed.
 * On API failure, seq is rolled back and up to EHDM_RECEIPT_MAX_ATTEMPTS retries are made.
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
    return { ok: false, error: `EHDM only for AMD orders (order ${order.number} has ${order.currency})` };
  }
  if (order.ehdmReceipt) {
    return {
      ok: true,
      receiptId: String(order.ehdmReceipt.receiptId),
      fiscal: order.ehdmReceipt.fiscal ?? undefined,
    };
  }

  let lastError: string | undefined;
  for (let attempt = 1; attempt <= EHDM_RECEIPT_MAX_ATTEMPTS; attempt++) {
    const currentOrder = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true, ehdmReceipt: true },
    });
    if (currentOrder?.ehdmReceipt) {
      return {
        ok: true,
        receiptId: String(currentOrder.ehdmReceipt.receiptId),
        fiscal: currentOrder.ehdmReceipt.fiscal ?? undefined,
      };
    }
    const orderToUse = currentOrder ?? order;

    let seq: number;
    try {
      seq = await getNextSeqAndIncrement();
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Failed to get seq";
      if (attempt === EHDM_RECEIPT_MAX_ATTEMPTS) {
        return { ok: false, error: lastError };
      }
      await sleep(EHDM_RECEIPT_RETRY_DELAY_MS);
      continue;
    }

    const body = buildPrintBody(orderToUse, seq);

    try {
      const response = await callPrint(body);
      if (response.code !== 0 || response.error || !response.result) {
        await decrementSeq();
        lastError =
          response.errorMessage ?? response.error ?? "EHDM print failed";
        console.error(
          `[EHDM] print failed (attempt ${attempt}/${EHDM_RECEIPT_MAX_ATTEMPTS}):`,
          orderToUse.number,
          lastError
        );
        if (attempt < EHDM_RECEIPT_MAX_ATTEMPTS) {
          await sleep(EHDM_RECEIPT_RETRY_DELAY_MS);
          continue;
        }
        return { ok: false, error: lastError };
      }

      const r = response.result;
      await db.ehdmReceipt.create({
        data: {
          orderId: orderToUse.id,
          receiptId: String(r.receiptId),
          seq,
          fiscal: r.fiscal,
          qr: r.qr,
          response: response as unknown as object,
        },
      });

      if (attempt > 1) {
        console.info("[EHDM] receipt created on retry", orderToUse.number, attempt);
      }
      return {
        ok: true,
        receiptId: String(r.receiptId),
        fiscal: r.fiscal,
      };
    } catch (e) {
      await decrementSeq();
      lastError = e instanceof Error ? e.message : "EHDM request failed";
      console.error(
        `[EHDM] request failed (attempt ${attempt}/${EHDM_RECEIPT_MAX_ATTEMPTS}):`,
        orderToUse.number,
        lastError
      );
      if (attempt < EHDM_RECEIPT_MAX_ATTEMPTS) {
        await sleep(EHDM_RECEIPT_RETRY_DELAY_MS);
        continue;
      }
      return { ok: false, error: lastError };
    }
  }

  return {
    ok: false,
    error: lastError ?? "EHDM receipt creation failed",
  };
}
