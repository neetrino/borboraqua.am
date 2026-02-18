/**
 * Idram — config and callback types from official API.
 */

export type IdramConfig = {
  isTest: boolean;
  recAccount: string;
  secretKey: string;
};

/** Form fields for POST to Idram GetPayment (UTF-8). */
export type IdramFormData = {
  EDP_LANGUAGE: string;
  EDP_REC_ACCOUNT: string;
  EDP_DESCRIPTION: string;
  EDP_AMOUNT: string;
  EDP_BILL_NO: string;
  EDP_EMAIL?: string;
  [key: string]: string | undefined;
};

/** Precheck request (RESULT_URL, first POST). */
export type IdramPrecheckParams = {
  EDP_PRECHECK: string;
  EDP_BILL_NO: string;
  EDP_REC_ACCOUNT: string;
  EDP_AMOUNT: string;
};

/** Payment confirmation request (RESULT_URL, second POST). */
export type IdramConfirmParams = {
  EDP_BILL_NO: string;
  EDP_REC_ACCOUNT: string;
  EDP_PAYER_ACCOUNT: string;
  EDP_AMOUNT: string;
  EDP_TRANS_ID: string;
  EDP_TRANS_DATE: string;
  EDP_CHECKSUM: string;
};
