/**
 * Telcell — config and callback types.
 */

export type TelcellConfig = {
  isTest: boolean;
  shopId: string;
  shopKey: string;
  apiUrl: string;
};

/** Params received at RESULT_URL (callback from Telcell) */
export type TelcellResultParams = {
  issuer_id: string;
  status: string;
  invoice?: string;
  payment_id?: string;
  currency?: string;
  sum?: string;
  time?: string;
  checksum: string;
};
