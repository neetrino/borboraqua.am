import { createHash } from "crypto";
import { getConfig } from "./config";
import { TELCELL_CURRENCY, TELCELL_ACTION_POST_INVOICE } from "./constants";

/**
 * Security code for PostInvoice redirect.
 * MD5(shop_key + issuer + currency + price + product + issuer_id + valid_days)
 * All concatenated as strings.
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
 * MD5(shop_key + invoice + issuer_id + payment_id + currency + sum + time + status)
 */
export function verifyTelcellResultChecksum(
  shopKey: string,
  invoice: string,
  issuerId: string,
  paymentId: string,
  currency: string,
  sum: string,
  time: string,
  status: string,
  receivedChecksum: string
): boolean {
  const str = shopKey + invoice + issuerId + paymentId + currency + sum + time + status;
  const expected = createHash("md5").update(str, "utf8").digest("hex");
  return (receivedChecksum ?? "").toLowerCase() === expected.toLowerCase();
}

/**
 * Build redirect URL for Telcell PostInvoice (user is sent here to pay).
 * REDIRECT_URL is configured with Telcell; Telcell appends params (e.g. issuer_id, order) when redirecting.
 */
export function buildTelcellRedirectUrl(params: {
  orderId: string;
  orderTotal: number;
  productDescription: string;
  validDays?: number;
  lang?: string;
}): string {
  const config = getConfig();
  const price = String(Math.round(params.orderTotal));
  const product = Buffer.from(params.productDescription, "utf8").toString("base64");
  const issuerId = Buffer.from(params.orderId, "utf8").toString("base64");
  const validDays = String(params.validDays ?? 1);
  const lang = params.lang ?? "am";

  const securityCode = getTelcellSecurityCode(
    config.shopKey,
    config.shopId,
    TELCELL_CURRENCY,
    price,
    product,
    issuerId,
    validDays
  );

  const search = new URLSearchParams({
    action: TELCELL_ACTION_POST_INVOICE,
    issuer: config.shopId,
    currency: TELCELL_CURRENCY,
    price,
    product,
    issuer_id: issuerId,
    valid_days: validDays,
    lang,
    security_code: securityCode,
  });
  return `${config.apiUrl}?${search.toString()}`;
}
