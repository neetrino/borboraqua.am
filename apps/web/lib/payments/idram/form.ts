import { getConfig } from "./config";
import { IDRAM_FORM_ACTION, IDRAM_LANG_MAP } from "./constants";
import type { IdramFormData } from "./types";

export type BuildIdramFormParams = {
  orderNumber: string;
  amount: number;
  description: string;
  lang?: string;
  email?: string;
};

/**
 * Build form data for POST to Idram GetPayment.
 * Doc: EDP_LANGUAGE, EDP_REC_ACCOUNT, EDP_DESCRIPTION, EDP_AMOUNT, EDP_BILL_NO; optional EDP_EMAIL.
 * Additional fields (no EDP_ prefix) are returned by Idram on redirect.
 */
export function buildIdramFormData(params: BuildIdramFormParams): {
  formAction: string;
  formData: IdramFormData;
} {
  const config = getConfig();
  const lang = IDRAM_LANG_MAP[params.lang ?? "en"] ?? "EN";
  const formData: IdramFormData = {
    EDP_LANGUAGE: lang,
    EDP_REC_ACCOUNT: config.recAccount,
    EDP_DESCRIPTION: params.description,
    EDP_AMOUNT: String(params.amount),
    EDP_BILL_NO: params.orderNumber,
  };
  if (params.email) {
    formData.EDP_EMAIL = params.email;
  }
  formData.order_number = params.orderNumber;
  return { formAction: IDRAM_FORM_ACTION, formData };
}
