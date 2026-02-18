/**
 * FastShift — API constants.
 * Source: docs/06-PAYMENT-INTEGRATION-PLAN.md §9; PayByFastShift / Api and more fastshift.
 */

/** Base URL for FastShift API (test/live same host; token differs) */
export const FASTSHIFT_API_BASE = "https://merchants.fastshift.am/api/en";

/** Register order endpoint */
export const FASTSHIFT_REGISTER_URL = `${FASTSHIFT_API_BASE}/vpos/order/register`;

/** Check order status (official doc: GET /vpos/order/status/{order_number}) */
export const FASTSHIFT_STATUS_API_PATH = "/vpos/order/status";

/** Official doc: order status "completed" = successfully paid; "rejected" | "expired" = fail */
export const FASTSHIFT_ORDER_STATUS_COMPLETED = "completed";

/** Callback param status values we accept as success (API returns "completed"; allow common variants) */
export const FASTSHIFT_STATUS_SUCCESS = ["completed", "success", "paid", "SUCCESS", "COMPLETED", "PAID"];

/** UUID v4 format (36 chars) for order_number validation */
export const FASTSHIFT_GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
