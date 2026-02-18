import { getConfig } from "./config";
import type {
  AmeriaInitPaymentRequest,
  AmeriaInitPaymentResponse,
  AmeriaGetPaymentDetailsRequest,
  AmeriaGetPaymentDetailsResponse,
} from "./types";
import { AMERIA_INIT_SUCCESS_RESPONSE_CODE } from "./constants";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

/**
 * InitPayment — register payment and get PaymentID.
 * Doc: https://servicestest.ameriabank.am/VPOS/api/VPOS/InitPayment
 * Success: ResponseCode === 1 (integer).
 */
export async function initPayment(
  params: Omit<
    AmeriaInitPaymentRequest,
    "ClientID" | "Username" | "Password"
  > & { ClientID?: string; Username?: string; Password?: string }
): Promise<AmeriaInitPaymentResponse> {
  const config = getConfig();
  const body: AmeriaInitPaymentRequest = {
    ClientID: params.ClientID ?? config.clientId,
    Username: params.Username ?? config.username,
    Password: params.Password ?? config.password,
    OrderID: params.OrderID,
    Amount: params.Amount,
    Currency: params.Currency,
    Description: params.Description,
    BackURL: params.BackURL,
    Opaque: params.Opaque,
    lang: params.lang ?? "en",
  };

  const url = `${config.baseUrl}/api/VPOS/InitPayment`;
  const res = await fetch(url, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ameriabank InitPayment HTTP ${res.status}: ${text}`);
  }

  const data = (await res.json()) as AmeriaInitPaymentResponse;
  return data;
}

/**
 * GetPaymentDetails — verify payment status.
 * Doc: https://servicestest.ameriabank.am/VPOS/api/VPOS/GetPaymentDetails
 * Success: ResponseCode === "00", PaymentState === "Successful" (or OrderStatus === 2).
 */
export async function getPaymentDetails(
  paymentId: string
): Promise<AmeriaGetPaymentDetailsResponse> {
  const config = getConfig();
  const body: AmeriaGetPaymentDetailsRequest = {
    PaymentID: paymentId,
    Username: config.username,
    Password: config.password,
  };

  const url = `${config.baseUrl}/api/VPOS/GetPaymentDetails`;
  const res = await fetch(url, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ameriabank GetPaymentDetails HTTP ${res.status}: ${text}`);
  }

  const data = (await res.json()) as AmeriaGetPaymentDetailsResponse;
  return data;
}

/**
 * Build redirect URL to bank Pay page.
 * Doc: https://servicestest.ameriabank.am/VPOS/Payments/Pay?id={PaymentID}&lang={lang}
 */
export function buildPayPageUrl(paymentId: string, lang: string = "en"): string {
  const config = getConfig();
  const path = `/Payments/Pay?id=${encodeURIComponent(paymentId)}&lang=${encodeURIComponent(lang)}`;
  return `${config.baseUrl}${path}`;
}

export function isInitSuccess(res: AmeriaInitPaymentResponse): boolean {
  return res.ResponseCode === AMERIA_INIT_SUCCESS_RESPONSE_CODE;
}
