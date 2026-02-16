/**
 * Cloudflare R2 (S3-compatible) client for uploading product images.
 * Uses env: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL.
 */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET ?? "borboraqua";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://pub-59e2e51324f14109af28620b830d1238.r2.dev";

function getClient(): S3Client | null {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

/**
 * Upload a buffer to R2 and return the public URL.
 * @param key - Object key (e.g. assets/products/abc-1.jpg)
 * @param body - Buffer or Uint8Array
 * @param contentType - e.g. image/jpeg
 * @returns Public URL or null if R2 is not configured or upload fails
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    return null;
  }
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    const base = R2_PUBLIC_URL.replace(/\/$/, "");
    const path = key.startsWith("/") ? key.slice(1) : key;
    return `${base}/${path}`;
  } catch (err) {
    console.error("[R2] Upload failed:", err);
    return null;
  }
}

export function isR2Configured(): boolean {
  return !!(R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}
