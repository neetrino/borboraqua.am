/**
 * Idram Merchant API — constants.
 * Source: payment integration/| Official doc for the API integrationm/IDram/Idram Merchant API New.md
 */

/** Form POST URL (same for test and production). */
export const IDRAM_FORM_ACTION = "https://banking.idram.am/Payment/GetPayment";

/** Interface language: RU, EN, AM */
export const IDRAM_LANG_MAP: Record<string, string> = {
  en: "EN",
  hy: "AM",
  am: "AM",
  ru: "RU",
};
