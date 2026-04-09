/**
 * Idempotent admin email when an online order becomes paid (callbacks or admin).
 */

import { db } from "@white-shop/db";
import { isCashLikePaymentMethod } from "@/lib/payments/constants";
import {
  sendOrderPaidNotificationToAdmin,
  type OrderDetailsForAdminEmail,
  type OrderItemForEmail,
} from "@/lib/email-templates/order-admin-notification";

function mapOrderToEmailDetails(order: {
  number: string;
  customerEmail: string | null;
  customerPhone: string | null;
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
}): OrderDetailsForAdminEmail {
  const method =
    order.payments[0]?.method ?? order.payments[0]?.provider ?? null;
  return {
    number: order.number,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
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
 * Sends admin "order paid" email once per order for non-cash payment methods.
 * Uses DB flag to avoid duplicates. Does not throw.
 */
export async function notifyAdminOrderPaid(orderId: string): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });
    if (!order || order.paymentStatus !== "paid") {
      return;
    }

    const method =
      order.payments[0]?.method ?? order.payments[0]?.provider ?? null;
    if (isCashLikePaymentMethod(method)) {
      return;
    }

    const claimed = await db.order.updateMany({
      where: {
        id: orderId,
        adminPaidNotificationSentAt: null,
      },
      data: { adminPaidNotificationSentAt: new Date() },
    });
    if (claimed.count === 0) {
      return;
    }

    await sendOrderPaidNotificationToAdmin(mapOrderToEmailDetails(order));
  } catch (err) {
    console.error("[EMAIL] notifyAdminOrderPaid failed:", err);
  }
}
