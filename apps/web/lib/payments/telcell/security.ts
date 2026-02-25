import { createHash } from "crypto";
import { getConfig } from "./config";
import { TELCELL_CURRENCY, TELCELL_ACTION_POST_INVOICE } from "./constants";

/**
 * Security code for PostInvoice redirect.
 * WEB Магазинный шлюз v1.2: PHP example = MD5(shop_key + issuer + currency + price + product + issuer_id + valid_days [+ ssn]).
 * product/issuer_id in the same form as sent (base64). We omit optional ssn.
 */
export function getTelcellSecurityCode(
  shopKey: string,
  issuer: string,
  currency: string,
  price: string,
  product: string,
  issuerId: string,
  validDays: string
): string {
  const str = shopKey + issuer + currency + price + product + issuerId + validDays;
  return createHash("md5").update(str, "utf8").digest("hex");
}

/**
 * Verify checksum from RESULT_URL callback.
 * WEB v1.2 (our flow): MD5(ключ + invoice + issuer_id + payment_id + currency + sum + time + status) — no buyer.
 * Fallback: with buyer for v2 (POST bill) callback format.
 */
export function verifyTelcellResultChecksum(
  shopKey: string,
  invoice: string,
  issuerId: string,
  paymentId: string,
  buyer: string,
  currency: string,
  sum: string,
  time: string,
  status: string,
  receivedChecksum: string
): boolean {
  const withBuyer =
    createHash("md5")
      .update(shopKey + invoice + issuerId + paymentId + buyer + currency + sum + time + status, "utf8")
      .digest("hex")
      .toLowerCase() === (receivedChecksum ?? "").toLowerCase();
  if (withBuyer) return true;
  const withoutBuyer =
    createHash("md5")
      .update(shopKey + invoice + issuerId + paymentId + currency + sum + time + status, "utf8")
      .digest("hex")
      .toLowerCase() === (receivedChecksum ?? "").toLowerCase();
  return withoutBuyer;
}

/**
 * Build redirect URL for Telcell PostInvoice (user is sent here to pay).
 * REDIRECT_URL is configured with Telcell; Telcell appends params (e.g. issuer_id, order) when redirecting.
 */
export function buildTelcellRedirectUrl(input: {
  orderId: string;
  orderTotal: number;
  productDescription: string;
  validDays?: number;
  lang?: string;
}): string {
  const config = getConfig();
  const price = String(Math.round(input.orderTotal));
  const product = Buffer.from(input.productDescription, "utf8").toString("base64");
  const issuerId = Buffer.from(input.orderId, "utf8").toString("base64");
  const validDays = String(input.validDays ?? 1);
  const lang = input.lang ?? "am";

  const securityCode = getTelcellSecurityCode(
    config.shopKey,
    config.shopId,
    TELCELL_CURRENCY,
    price,
    product,
    issuerId,
    validDays
  );

  const queryParams: Record<string, string> = {
    action: TELCELL_ACTION_POST_INVOICE,
    issuer: config.shopId,
    currency: TELCELL_CURRENCY,
    price,
    product,
    issuer_id: issuerId,
    valid_days: validDays,
    lang,
    security_code: securityCode,
  };
  const query = Object.entries(queryParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${config.apiUrl}?${query}`;
}
