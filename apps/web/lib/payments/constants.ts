/**
 * Payment status values used in Order.paymentStatus and Payment.status.
 * Aligned with docs/06-PAYMENT-INTEGRATION-PLAN.md (§2).
 */
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  SUCCESS: "paid",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type PaymentStatusValue =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/** Human-readable labels for admin and profile (key = status value). */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PAYMENT_STATUS.PENDING]: "Pending",
  [PAYMENT_STATUS.PAID]: "Paid",
  [PAYMENT_STATUS.FAILED]: "Failed",
  [PAYMENT_STATUS.CANCELLED]: "Cancelled",
  [PAYMENT_STATUS.REFUNDED]: "Refunded",
};
