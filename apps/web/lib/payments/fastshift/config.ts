import type { FastshiftConfig } from "./types";

function getFastshiftConfig(): FastshiftConfig {
  const isTest = process.env.FASTSHIFT_TEST_MODE === "true";
  const token = isTest
    ? (process.env.FASTSHIFT_TOKEN ?? "")
    : (process.env.FASTSHIFT_LIVE_TOKEN ?? "");

  return { isTest, token };
}

let cachedConfig: FastshiftConfig | null = null;

export function getConfig(): FastshiftConfig {
  if (!cachedConfig) {
    cachedConfig = getFastshiftConfig();
  }
  return cachedConfig;
}

export function isFastshiftConfigured(): boolean {
  const c = getConfig();
  return Boolean(c.token);
}
