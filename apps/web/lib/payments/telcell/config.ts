import type { TelcellConfig } from "./types";
import { TELCELL_API_URL_TEST, TELCELL_API_URL_LIVE } from "./constants";

function getTelcellConfig(): TelcellConfig {
  const isTest = process.env.TELCELL_TEST_MODE === "true";
  const shopId = isTest
    ? (process.env.TELCELL_SHOP_ID ?? "")
    : (process.env.TELCELL_LIVE_SHOP_ID ?? "");
  const shopKey = isTest
    ? (process.env.TELCELL_SHOP_KEY ?? "")
    : (process.env.TELCELL_LIVE_SHOP_KEY ?? "");
  const apiUrl = isTest ? TELCELL_API_URL_TEST : TELCELL_API_URL_LIVE;

  return { isTest, shopId, shopKey, apiUrl };
}

let cachedConfig: TelcellConfig | null = null;

export function getConfig(): TelcellConfig {
  if (!cachedConfig) {
    cachedConfig = getTelcellConfig();
  }
  return cachedConfig;
}

export function isTelcellConfigured(): boolean {
  const c = getConfig();
  return Boolean(c.shopId && c.shopKey);
}
