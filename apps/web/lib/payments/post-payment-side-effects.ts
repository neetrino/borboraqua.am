/**
 * After successful online payment: EHDM print, then customer email, then admin email.
 * Used from payment callbacks via `after()` so the gateway response is not blocked for long.
 */

import { after } from "next/server";
import { printReceiptForOrder } from "@/lib/payments/ehdm";
import { notifyAdminOrderPaid } from "@/lib/email-templates/notify-admin-order-paid";
import { notifyCustomerAfterPaidOrder } from "@/lib/email-templates/notify-customer-order-paid";

export function scheduleAfterSuccessfulOnlinePayment(orderId: string): void {
  after(async () => {
    const r = await printReceiptForOrder(orderId);
    if (!r.ok) {
      console.error("[EHDM] printReceiptForOrder", orderId, r.error);
    }
    await notifyCustomerAfterPaidOrder(orderId);
    await notifyAdminOrderPaid(orderId);
  });
}
