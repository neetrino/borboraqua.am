import fs from "fs";
import os from "os";
import path from "path";
import type { EhdmConfig } from "./types";

function resolvePath(envValue: string | undefined): string {
  if (!envValue || envValue.trim() === "") return "";
  const p = envValue.trim();
  if (path.isAbsolute(p)) return p;
  return path.resolve(process.cwd(), p);
}

/** Cert/key: if EHDM_CERT_BASE64 + EHDM_KEY_BASE64 set → decode to /tmp (local + Vercel); else use EHDM_CERT_PATH / EHDM_KEY_PATH (file paths). */
function resolveCertAndKeyPaths(): { certPath: string; keyPath: string } {
  const certBase64 = process.env.EHDM_CERT_BASE64?.trim();
  const keyBase64 = process.env.EHDM_KEY_BASE64?.trim();
  if (certBase64 && keyBase64) {
    const certContent = Buffer.from(certBase64, "base64").toString("utf8");
    const keyContent = Buffer.from(keyBase64, "base64").toString("utf8");
    const tmpDir = os.tmpdir();
    const certPath = path.join(tmpDir, "ehdm-cert.pem");
    const keyPath = path.join(tmpDir, "ehdm-key.pem");
    fs.writeFileSync(certPath, certContent, { mode: 0o600 });
    fs.writeFileSync(keyPath, keyContent, { mode: 0o600 });
    return { certPath, keyPath };
  }
  if (certBase64 || keyBase64) {
    return { certPath: "", keyPath: "" };
  }
  return {
    certPath: resolvePath(process.env.EHDM_CERT_PATH),
    keyPath: resolvePath(process.env.EHDM_KEY_PATH),
  };
}

function getEhdmConfig(): EhdmConfig {
  const apiUrl = (process.env.EHDM_API_URL ?? "").replace(/\/$/, "");
  const crn = process.env.EHDM_CRN ?? "";
  const tin = process.env.EHDM_TIN ?? "";
  const { certPath, keyPath } = resolveCertAndKeyPaths();
  const keyPassphrase = process.env.EHDM_KEY_PASSPHRASE ?? "";
  const initialSeq = Math.max(1, parseInt(process.env.EHDM_INITIAL_SEQ ?? "200", 10) || 200);
  const defaultAdgCode = process.env.EHDM_DEFAULT_ADG_CODE ?? "2201";
  const dep = Math.min(7, Math.max(1, parseInt(process.env.EHDM_DEP ?? "1", 10) || 1));
  const defaultUnit = process.env.EHDM_DEFAULT_UNIT ?? "Հատ";
  const cashierId = Math.max(1, parseInt(process.env.EHDM_CASHIER_ID ?? "1", 10) || 1);
  const shippingEnabled = process.env.EHDM_SHIPPING_ENABLED === "1";
  const shippingAdgCode = process.env.EHDM_SHIPPING_ADG_CODE ?? "49.42";
  const shippingGoodCode = process.env.EHDM_SHIPPING_GOOD_CODE ?? "007";
  const shippingDescription = process.env.EHDM_SHIPPING_DESCRIPTION ?? "Առաքում";
  const shippingUnit = process.env.EHDM_SHIPPING_UNIT ?? "Հատ";

  return {
    apiUrl,
    crn,
    tin,
    certPath,
    keyPath,
    keyPassphrase,
    initialSeq,
    defaultAdgCode,
    dep,
    defaultUnit,
    cashierId,
    shippingEnabled,
    shippingAdgCode,
    shippingGoodCode,
    shippingDescription,
    shippingUnit,
  };
}

let cachedConfig: EhdmConfig | null = null;

export function getConfig(): EhdmConfig {
  if (!cachedConfig) {
    cachedConfig = getEhdmConfig();
  }
  return cachedConfig;
}

export function isEhdmConfigured(): boolean {
  const c = getConfig();
  return Boolean(
    c.apiUrl &&
      c.crn &&
      c.tin &&
      c.certPath &&
      c.keyPath
  );
}
