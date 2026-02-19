/**
 * EHDM (Էլեկտրոնային ՀԴՄ) — config and API types.
 * Source: docs/payments/EHDM-INTEGRATION.md, official Tax Service API.
 */

export type EhdmConfig = {
  apiUrl: string;
  crn: string;
  tin: string;
  certPath: string;
  keyPath: string;
  keyPassphrase: string;
  initialSeq: number;
  defaultAdgCode: string;
  dep: number;
  defaultUnit: string;
  cashierId: number;
  shippingEnabled: boolean;
  shippingAdgCode: string;
  shippingGoodCode: string;
  shippingDescription: string;
  shippingUnit: string;
};

/** Request body for POST /print (fiscal receipt) */
export type EhdmPrintItem = {
  dep: number;
  adgCode: string;
  goodCode: string;
  goodName: string;
  quantity: number;
  unit: string;
  price: number;
  discount?: number;
  discountType?: number;
};

export type EhdmPrintRequestBody = {
  mode: number;
  crn: string;
  seq: number;
  cashierId: number;
  cardAmount?: number;
  cashAmount?: number;
  items: EhdmPrintItem[];
};

/** Success response from /print */
export type EhdmPrintResult = {
  crn: string;
  sn: string;
  tin: string;
  taxpayer: string;
  address: string;
  time: number;
  fiscal: string;
  receiptId: number;
  total: number;
  qr: string;
};

export type EhdmPrintResponse = {
  code: number;
  error?: string;
  errorMessage?: string;
  result?: EhdmPrintResult;
};
