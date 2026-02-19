/**
 * Ameriabank vPOS 3.1 — request/response types from official API.
 */

export type AmeriaConfig = {
  isTest: boolean;
  clientId: string;
  username: string;
  password: string;
  baseUrl: string;
};

/** InitPayment request — doc: InitPaymentRequest */
export type AmeriaInitPaymentRequest = {
  ClientID: string;
  Username: string;
  Password: string;
  OrderID: number;
  Amount: number;
  Currency: string;
  Description: string;
  BackURL: string;
  Opaque?: string;
  lang?: string;
  CardHolderID?: string;
  Timeout?: number;
};

/** InitPayment response — doc: ResponseCode successful=1 (integer) */
export type AmeriaInitPaymentResponse = {
  PaymentID?: string;
  ResponseCode: number;
  ResponseMessage?: string;
};

/** GetPaymentDetails request — doc: PaymentID, Username, Password */
export type AmeriaGetPaymentDetailsRequest = {
  PaymentID: string;
  Username: string;
  Password: string;
};

/** GetPaymentDetails response — doc: ResponseCode "00", PaymentState string */
export type AmeriaGetPaymentDetailsResponse = {
  ResponseCode?: string;
  PaymentState?: string;
  OrderStatus?: number;
  Amount?: number;
  ApprovedAmount?: number;
  CardNumber?: string;
  OrderID?: number | string;
  Opaque?: string;
  [key: string]: unknown;
};

/** BackURL query params (doc typo: resposneCode) */
export type AmeriaBackUrlParams = {
  orderID: string;
  resposneCode: string;
  paymentID: string;
  opaque?: string;
  currency?: string;
};
