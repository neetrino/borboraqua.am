/**
 * Idempotent customer emails: cash at checkout; online after payment + EHDM attempt.
 */

import { db } from "@white-shop/db";
import { isCashLikePaymentMethod } from "@/lib/payments/constants";
import {
  sendCustomerCashOrderEmail,
  sendCustomerPaidOrderEmail,
  type EhdmReceiptForEmail,
} from "@/lib/email-templates/customer-order-email";
import type {
  OrderDetailsForAdminEmail,
  OrderItemForEmail,
} from "@/lib/email-templates/order-admin-email-shared";

function mapToDetails(order: {
  number: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerLocale: string;
  total: number;
  currency: string | null;
  shippingAddress: unknown;
  shippingMethod: string | null;
  items: Array<{
    productTitle: string;
    variantTitle: string | null;
    sku: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  payments: Array<{ method: string | null; provider: string }>;
}): OrderDetailsForAdminEmail & {
  customerEmail: string;
  customerLocale: string | null;
} {
  const method =
    order.payments[0]?.method ?? order.payments[0]?.provider ?? null;
  return {
    number: order.number,
    customerEmail: order.customerEmail ?? "",
    customerPhone: order.customerPhone,
    customerLocale: order.customerLocale,
    total: order.total,
    currency: order.currency ?? "AMD",
    shippingAddress: order.shippingAddress,
    shippingMethod: order.shippingMethod,
    paymentMethod: method,
    items: order.items.map(
      (i): OrderItemForEmail => ({
        productTitle: i.productTitle,
        variantTitle: i.variantTitle,
        sku: i.sku,
        quantity: i.quantity,
        price: i.price,
        total: i.total,
      })
    ),
  };
}

/**
 * Cash/COD: one confirmation email at checkout. Idempotent.
 */
export async function notifyCustomerCashOrderEmail(orderId: string): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });
    if (!order?.customerEmail?.trim()) {
      return;
    }
    const method =
      order.payments[0]?.method ?? order.payments[0]?.provider ?? null;
    if (!isCashLikePaymentMethod(method)) {
      return;
    }

    const claimed = await db.order.updateMany({
      where: {
        id: orderId,
        customerCashOrderEmailSentAt: null,
      },
      data: { customerCashOrderEmailSentAt: new Date() },
    });
    if (claimed.count === 0) {
      return;
    }

    const details = mapToDetails(order);
    if (!details.customerEmail.trim()) {
      return;
    }
    await sendCustomerCashOrderEmail(details);
  } catch (err) {
    console.error("[EMAIL] notifyCustomerCashOrderEmail failed:", err);
  }
}

/**
 * Online payment: one email after payment with EHDM data if present, else fallback text.
 */
export async function notifyCustomerAfterPaidOrder(
  orderId: string
): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true, ehdmReceipt: true },
    });
    if (!order || order.paymentStatus !== "paid") {
      if (order && order.paymentStatus !== "paid") {
        console.warn(
          "[EMAIL] notifyCustomerAfterPaidOrder: order not paid",
          orderId,
          order.paymentStatus
        );
      }
      return;
    }
    if (!order.customerEmail?.trim()) {
      console.warn(
        "[EMAIL] notifyCustomerAfterPaidOrder: no customer email",
        orderId
      );
      return;
    }

    const claimed = await db.order.updateMany({
      where: {
        id: orderId,
        customerPaidOrderEmailSentAt: null,
      },
      data: { customerPaidOrderEmailSentAt: new Date() },
    });
    if (claimed.count === 0) {
      console.warn(
        "[EMAIL] notifyCustomerAfterPaidOrder: already sent or race",
        orderId
      );
      return;
    }

    const details = mapToDetails(order);
    if (!details.customerEmail.trim()) {
      return;
    }

    const ehdmRow = order.ehdmReceipt;
    const ehdm: EhdmReceiptForEmail | null = ehdmRow
      ? {
          receiptId: String(ehdmRow.receiptId),
          fiscal: ehdmRow.fiscal,
          qr: ehdmRow.qr,
        }
      : null;

    await sendCustomerPaidOrderEmail(details, ehdm);
  } catch (err) {
    console.error("[EMAIL] notifyCustomerAfterPaidOrder failed:", err);
  }
}
