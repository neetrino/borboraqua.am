import type { IdramConfig } from "./types";

function getIdramConfig(): IdramConfig {
  const isTest = process.env.IDRAM_TEST_MODE === "true";
  const recAccount = isTest
    ? (process.env.IDRAM_REC_ACCOUNT ?? "")
    : (process.env.IDRAM_LIVE_REC_ACCOUNT ?? "");
  const secretKey = isTest
    ? (process.env.IDRAM_SECRET_KEY ?? "")
    : (process.env.IDRAM_LIVE_SECRET_KEY ?? "");

  return { isTest, recAccount, secretKey };
}

let cachedConfig: IdramConfig | null = null;

export function getConfig(): IdramConfig {
  if (!cachedConfig) {
    cachedConfig = getIdramConfig();
  }
  return cachedConfig;
}

export function isIdramConfigured(): boolean {
  const c = getConfig();
  return Boolean(c.recAccount && c.secretKey);
}
