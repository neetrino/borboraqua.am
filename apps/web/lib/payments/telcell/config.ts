import type { TelcellConfig } from "./types";
import { TELCELL_API_BASE_URL } from "./constants";

function getTelcellConfig(): TelcellConfig {
  const isTest = process.env.TELCELL_TEST_MODE === "true";
  const shopId = isTest
    ? (process.env.TELCELL_SHOP_ID ?? "")
    : (process.env.TELCELL_LIVE_SHOP_ID ?? "");
  const shopKey = isTest
    ? (process.env.TELCELL_SHOP_KEY ?? "")
    : (process.env.TELCELL_LIVE_SHOP_KEY ?? "");
  // Telcell: test և live — նույն endpoint (https://telcellmoney.am/invoices)
  const apiUrl = TELCELL_API_BASE_URL;

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
