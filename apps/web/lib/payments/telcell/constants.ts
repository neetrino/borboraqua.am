/**
 * Telcell Money — API constants.
 * Source: payment integration/| Official doc + Example only/HK Agency/payment-gateway-for-telcell
 *
 * Telcell support-ի հաստատում. test և live ռեժիմներն երկուսն էլ պետք է օգտագործեն
 * նույն endpoint-ը: https://telcellmoney.am/invoices (ոչ proto_test2).
 */

/** API base URL (invoices). Test և live — նույն URL (Telcell-ի պահանջ). */
export const TELCELL_API_BASE_URL = "https://telcellmoney.am/invoices";

/** @deprecated Օգտագործել TELCELL_API_BASE_URL. Պահպանված backward compatibility-ի համար. */
export const TELCELL_API_URL_TEST = TELCELL_API_BASE_URL;
/** @deprecated Օգտագործել TELCELL_API_BASE_URL. Պահպանված backward compatibility-ի համար. */
export const TELCELL_API_URL_LIVE = TELCELL_API_BASE_URL;

/** Currency: Telcell ակնկալում է symbol ֏ (support-ը հաստատել է) */
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
