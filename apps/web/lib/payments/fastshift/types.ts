/**
 * FastShift — API types.
 */

export interface FastshiftConfig {
  isTest: boolean;
  token: string;
}

export interface FastshiftRegisterRequest {
  order_number: string;
  amount: number;
  description: string;
  callback_url: string;
  webhook_url?: string;
  external_order_id?: string;
}

export interface FastshiftRegisterResponse {
  data?: {
    redirect_url?: string;
    order?: { order_number?: string };
  };
  redirect_url?: string;
}

export interface FastshiftCallbackParams {
  status?: string;
  order?: string;
  order_number?: string;
  orderNumber?: string;
  transaction_id?: string;
  payment_id?: string;
  [key: string]: string | undefined;
}
