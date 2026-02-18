/**
 * Ameriabank vPOS 3.1 — constants from official API documentation.
 * Source: payment integration/| Official doc for the API integrationm/AmeriaBank/vPOS - Ameriabank.md
 */

/** Base URLs (no trailing slash) */
export const AMERIA_BASE_URL_TEST = "https://servicestest.ameriabank.am/VPOS";
export const AMERIA_BASE_URL_LIVE = "https://services.ameriabank.am/VPOS";

/** InitPayment: success = 1 (integer) */
export const AMERIA_INIT_SUCCESS_RESPONSE_CODE = 1;

/** GetPaymentDetails / BackURL: success = "00" (string). Doc typo: BackURL param is "resposneCode" */
export const AMERIA_PAYMENT_SUCCESS_RESPONSE_CODE = "00";

/** PaymentState from GetPaymentDetails — successful payment */
export const AMERIA_PAYMENT_STATE_SUCCESSFUL = "Successful";

/** OrderStatus from Table 2: 2 = payment_deposited (Amount successfully authorized) */
export const AMERIA_ORDER_STATUS_DEPOSITED = 2;

/** Currency codes for vPOS (ISO 4217 numeric) */
export const AMERIA_CURRENCY_AMD = "051";
export const AMERIA_CURRENCY_EUR = "978";
export const AMERIA_CURRENCY_USD = "840";
export const AMERIA_CURRENCY_RUB = "643";

export const AMERIA_CURRENCY_MAP: Record<string, string> = {
  AMD: AMERIA_CURRENCY_AMD,
  EUR: AMERIA_CURRENCY_EUR,
  USD: AMERIA_CURRENCY_USD,
  RUB: AMERIA_CURRENCY_RUB,
};

/** Pay page path: /VPOS/Payments/Pay?id={PaymentID}&lang={lang} */
export const AMERIA_PAY_PAGE_PATH = "/Payments/Pay";
