import { getConfig } from "./config";
import type {
  FastshiftRegisterRequest,
  FastshiftRegisterResponse,
  FastshiftOrderStatusResponse,
} from "./types";
import { FASTSHIFT_REGISTER_URL, FASTSHIFT_API_BASE, FASTSHIFT_STATUS_API_PATH } from "./constants";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

/**
 * Register order with FastShift; returns redirect_url for user.
 * POST merchants.fastshift.am with Bearer token.
 */
export async function registerOrder(
  params: FastshiftRegisterRequest
): Promise<{ redirectUrl: string; orderNumber?: string }> {
  const config = getConfig();
  const res = await fetch(FASTSHIFT_REGISTER_URL, {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify(params),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`FastShift register HTTP ${res.status}: ${text}`);
  }

  let data: FastshiftRegisterResponse;
  try {
    data = JSON.parse(text) as FastshiftRegisterResponse;
  } catch {
    throw new Error("FastShift register: invalid JSON response");
  }

  const redirectUrl =
    data.data?.redirect_url ?? (data as { redirect_url?: string }).redirect_url;
  if (!redirectUrl || typeof redirectUrl !== "string") {
    throw new Error("FastShift register: missing redirect_url in response");
  }

  const orderNumber =
    data.data?.order?.order_number ?? (params as { order_number?: string }).order_number;

  return { redirectUrl, orderNumber: typeof orderNumber === "string" ? orderNumber : undefined };
}

/**
 * Check order status via FastShift API (official doc).
 * GET /vpos/order/status/{order_number}; use response as source of truth for callback.
 */
export async function getOrderStatus(orderNumberGuid: string): Promise<{ status: string } | null> {
  const config = getConfig();
  const url = `${FASTSHIFT_API_BASE}${FASTSHIFT_STATUS_API_PATH}/${encodeURIComponent(orderNumberGuid)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
    },
  });
  if (!res.ok) return null;
  const text = await res.text();
  let data: FastshiftOrderStatusResponse;
  try {
    data = JSON.parse(text) as FastshiftOrderStatusResponse;
  } catch {
    return null;
  }
  const status = data.data?.order?.status ?? data.status;
  return typeof status === "string" ? { status } : null;
}
