/**
 * FastShift — API constants.
 * Source: docs/06-PAYMENT-INTEGRATION-PLAN.md §9; PayByFastShift / Api and more fastshift.
 */

/** Register order endpoint (test and live use same host; token differs) */
export const FASTSHIFT_REGISTER_URL =
  "https://merchants.fastshift.am/api/en/vpos/order/register";

/** Callback status values that mean successful payment */
export const FASTSHIFT_STATUS_SUCCESS = ["success", "completed", "paid", "SUCCESS", "COMPLETED", "PAID"];

/**
 * FastShift expects order_number as GUID/UUID (see HK Agency payment-gateway-for-fastshift).
 * Generate UUID v4 for register; store in Payment.providerTransactionId; callback can use order from URL.
 */
export function generateFastshiftOrderGuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const hex = "0123456789abcdef";
  const r = () => hex[Math.floor(Math.random() * 16)];
  const v4 = hex[8 + Math.floor(Math.random() * 4)]; // 8,9,a,b
  return `${r()}${r()}${r()}${r()}${r()}${r()}${r()}${r()}-${r()}${r()}${r()}${r()}-4${r()}${r()}${r()}-${v4}${r()}${r()}${r()}-${r()}${r()}${r()}${r()}${r()}${r()}${r()}${r()}${r()}${r()}${r()}${r()}${r()}`;
}
