import type { FastshiftConfig } from "./types";

function getFastshiftConfig(): FastshiftConfig {
  const isTest = process.env.FASTSHIFT_TEST_MODE === "true";
  const token = isTest
    ? (process.env.FASTSHIFT_TOKEN ?? "")
    : (process.env.FASTSHIFT_LIVE_TOKEN ?? "");
  const webhookSecret = process.env.FASTSHIFT_WEBHOOK_SECRET ?? "";
  const webhookFailOpen = process.env.FASTSHIFT_WEBHOOK_FAIL_OPEN === "true";

  return { isTest, token, webhookSecret, webhookFailOpen };
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
