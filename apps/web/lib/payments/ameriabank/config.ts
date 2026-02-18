import type { AmeriaConfig } from "./types";
import {
  AMERIA_BASE_URL_TEST,
  AMERIA_BASE_URL_LIVE,
} from "./constants";

function getAmeriaConfig(): AmeriaConfig {
  const isTest = process.env.AMERIA_TEST_MODE === "true";
  const clientId = isTest
    ? (process.env.AMERIA_CLIENT_ID ?? "")
    : (process.env.AMERIA_LIVE_CLIENT_ID ?? "");
  const username = isTest
    ? (process.env.AMERIA_USERNAME ?? "")
    : (process.env.AMERIA_LIVE_USERNAME ?? "");
  const password = isTest
    ? (process.env.AMERIA_PASSWORD ?? "")
    : (process.env.AMERIA_LIVE_PASSWORD ?? "");
  const baseUrl = isTest ? AMERIA_BASE_URL_TEST : AMERIA_BASE_URL_LIVE;

  return { isTest, clientId, username, password, baseUrl };
}

let cachedConfig: AmeriaConfig | null = null;

export function getConfig(): AmeriaConfig {
  if (!cachedConfig) {
    cachedConfig = getAmeriaConfig();
  }
  return cachedConfig;
}

export function isAmeriaConfigured(): boolean {
  const c = getConfig();
  return Boolean(c.clientId && c.username && c.password);
}

/** Generate unique integer OrderID for vPOS (doc requires integer). */
export function toAmeriaOrderId(orderId: string): number {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    const c = orderId.charCodeAt(i);
    hash = (hash << 5) - hash + c;
    hash = hash & 0x7fffffff;
  }
  return hash % 1000000000 || 1;
}
