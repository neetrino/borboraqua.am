/**
 * Telcell Money — API constants.
 * Source: payment integration/| Official doc + Example only/HK Agency/payment-gateway-for-telcell
 */

/** API base URLs (invoices endpoint) */
export const TELCELL_API_URL_TEST = "https://telcellmoney.am/proto_test2/invoices";
export const TELCELL_API_URL_LIVE = "https://telcellmoney.am/invoices";

/** Currency: AMD (Telcell uses symbol in API) */
export const TELCELL_CURRENCY = "֏";

/** Action for creating invoice */
export const TELCELL_ACTION_POST_INVOICE = "PostInvoice";

/** Success status from RESULT_URL callback */
export const TELCELL_STATUS_PAID = "PAID";

/** Lang: am, ru, en */
export const TELCELL_LANG_MAP: Record<string, string> = {
  en: "en",
  hy: "am",
  am: "am",
  ru: "ru",
};
