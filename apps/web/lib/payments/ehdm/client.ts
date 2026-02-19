import https from "https";
import fs from "fs";
import { getConfig } from "./config";

/**
 * Create HTTPS agent with client certificate for EHDM API.
 * Cert and key are read from paths in config (env).
 */
function createAgent(): https.Agent {
  const config = getConfig();
  if (!config.certPath || !config.keyPath) {
    throw new Error("EHDM: EHDM_CERT_PATH and EHDM_KEY_PATH are required");
  }
  const cert = fs.readFileSync(config.certPath, "utf8");
  const key = fs.readFileSync(config.keyPath, "utf8");
  return new https.Agent({
    cert,
    key,
    passphrase: config.keyPassphrase || undefined,
    rejectUnauthorized: true,
  });
}

/**
 * POST JSON to EHDM API (client certificate auth).
 */
export async function ehdmPost<TResponse = unknown>(
  path: string,
  body: object
): Promise<TResponse> {
  const config = getConfig();
  const url = new URL(path.startsWith("http") ? path : `${config.apiUrl}${path}`);
  const agent = createAgent();
  const bodyStr = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyStr, "utf8"),
        },
        agent,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          try {
            const data = JSON.parse(text) as TResponse;
            resolve(data);
          } catch {
            reject(new Error(`EHDM API invalid JSON: ${text.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(bodyStr, "utf8");
    req.end();
  });
}
