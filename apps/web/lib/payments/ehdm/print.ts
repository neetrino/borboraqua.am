import type { Order, OrderItem, Payment } from "@white-shop/db";
import { getConfig } from "./config";
import { ehdmPost } from "./client";
import type {
  EhdmPrintRequestBody,
  EhdmPrintResponse,
  EhdmPrintItem,
} from "./types";

const MODE_SALE_WITH_ITEMS = 2;
const GOOD_NAME_MAX_LENGTH = 30;

export type OrderWithItemsAndPayments = Order & {
  items: OrderItem[];
  payments?: Payment[];
};

/**
 * Build EHDM /print request body from order and config.
 */
export function buildPrintBody(
  order: OrderWithItemsAndPayments,
  seq: number
): EhdmPrintRequestBody {
  const config = getConfig();
  const total = Number(order.total);
  const isCash =
    order.payments?.some((p) => p.provider === "cash_on_delivery") ?? false;

  const items: EhdmPrintItem[] = [];

  for (const item of order.items) {
    const quantity = Number(item.quantity);
    const unitPrice =
      quantity > 0 ? Number(item.total) / quantity : Number(item.price);
    const goodName = (item.productTitle || "Product").slice(
      0,
      GOOD_NAME_MAX_LENGTH
    );
    items.push({
      dep: config.dep,
      adgCode: config.defaultAdgCode,
      goodCode: item.sku || "0",
      goodName,
      quantity,
      unit: config.defaultUnit,
      price: Math.round(unitPrice * 10) / 10,
    });
  }

  if (config.shippingEnabled && order.shippingAmount != null && Number(order.shippingAmount) > 0) {
    items.push({
      dep: config.dep,
      adgCode: config.shippingAdgCode,
      goodCode: config.shippingGoodCode,
      goodName: config.shippingDescription,
      quantity: 1,
      unit: config.shippingUnit,
      price: Number(order.shippingAmount),
    });
  }

  const body: EhdmPrintRequestBody = {
    mode: MODE_SALE_WITH_ITEMS,
    crn: config.crn,
    seq,
    cashierId: config.cashierId,
    partialAmount: 0,
    prePaymentAmount: 0,
    partnerTin: null,
    items,
  };

  if (isCash) {
    body.cashAmount = total;
    body.cardAmount = 0;
  } else {
    body.cardAmount = total;
    body.cashAmount = 0;
  }

  return body;
}

/**
 * Call EHDM /print and return parsed response.
 */
export async function callPrint(
  body: EhdmPrintRequestBody
): Promise<EhdmPrintResponse> {
  return ehdmPost<EhdmPrintResponse>("/print", body);
}
