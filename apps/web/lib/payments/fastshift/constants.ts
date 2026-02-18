/**
 * FastShift — API constants.
 * Source: docs/06-PAYMENT-INTEGRATION-PLAN.md §9; PayByFastShift / Api and more fastshift.
 */

/** Register order endpoint (test and live use same host; token differs) */
export const FASTSHIFT_REGISTER_URL =
  "https://merchants.fastshift.am/api/en/vpos/order/register";

/** Callback status values that mean successful payment */
export const FASTSHIFT_STATUS_SUCCESS = ["success", "completed", "paid", "SUCCESS", "COMPLETED", "PAID"];
