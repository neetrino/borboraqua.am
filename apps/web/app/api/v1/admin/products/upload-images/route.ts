import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { uploadToR2, isR2Configured } from "@/lib/r2-client";
import { randomUUID } from "crypto";
import { parseBody, adminUploadImagesBodySchema } from "@/lib/validate";
import { validateOrigin } from "@/lib/csrf";

const ALLOWED_FOLDERS = ["products", "labels"] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB per image
const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20MB per request
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function parseFolder(value: unknown): UploadFolder {
  if (typeof value === "string" && ALLOWED_FOLDERS.includes(value as UploadFolder)) {
    return value as UploadFolder;
  }
  return "products";
}

/**
 * POST /api/v1/admin/products/upload-images
 * Upload images to R2 and return public URLs.
 *
 * Request body: { images: string[], folder?: "products" | "labels" } (folder defaults to "products"; use "labels" for label images)
 * Response: { urls: string[] } (R2 public URLs)
 */
export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();
  const csrf = validateOrigin(req);
  if (csrf) return csrf;

  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const parsed = await parseBody(req, adminUploadImagesBodySchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const validImages: string[] = [];
    let totalApproxBytes = 0;
    for (let i = 0; i < body.images.length; i++) {
      const image = body.images[i];
      if (typeof image !== "string") {
        return NextResponse.json(
          {
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            status: 400,
            detail: `Image at index ${i} must be a string`,
            instance: req.url,
          },
          { status: 400 }
        );
      }

      const match = image.match(/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i);
      if (!match) {
        return NextResponse.json(
          {
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            status: 400,
            detail: `Image at index ${i} must be a valid base64 data URL`,
            instance: req.url,
          },
          { status: 400 }
        );
      }
      const contentType = match[1].toLowerCase();
      if (!ALLOWED_IMAGE_MIME_TYPES.has(contentType)) {
        return NextResponse.json(
          {
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            status: 400,
            detail: `Image at index ${i} uses unsupported type ${contentType}`,
            instance: req.url,
          },
          { status: 400 }
        );
      }

      const approxBytes = Math.floor((match[2].length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          {
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            status: 400,
            detail: `Image at index ${i} exceeds ${MAX_IMAGE_BYTES} bytes`,
            instance: req.url,
          },
          { status: 400 }
        );
      }

      totalApproxBytes += approxBytes;
      if (totalApproxBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json(
          {
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            status: 400,
            detail: `Total upload size exceeds ${MAX_TOTAL_BYTES} bytes`,
            instance: req.url,
          },
          { status: 400 }
        );
      }
      validImages.push(image);
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/config-error",
          title: "R2 not configured",
          status: 503,
          detail: "Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in env to upload images.",
          instance: req.url,
        },
        { status: 503 }
      );
    }

    const folder = parseFolder(body.folder);

    const urls: string[] = [];
    for (let i = 0; i < validImages.length; i++) {
      const dataUrl = validImages[i];
      const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i);
      if (!match) {
        urls.push("");
        continue;
      }
      const contentType = match[1];
      const base64Data = match[2];
      if (!ALLOWED_IMAGE_MIME_TYPES.has(contentType.toLowerCase())) {
        urls.push("");
        continue;
      }
      const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
      const key = `assets/${folder}/${randomUUID()}-${i}.${ext}`;
      const buffer = Buffer.from(base64Data, "base64");
      if (buffer.byteLength > MAX_IMAGE_BYTES) {
        urls.push("");
        continue;
      }
      const url = await uploadToR2(key, buffer, contentType);
      urls.push(url ?? "");
    }

    const failed = urls.filter((u) => !u).length;
    if (failed > 0) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/internal-error",
          title: "Upload failed",
          status: 500,
          detail: `Failed to upload ${failed} of ${validImages.length} images to R2.`,
          instance: req.url,
        },
        { status: 500 }
      );
    }

    const totalTime = Date.now() - requestStartTime;
    console.log(`[ADMIN UPLOAD IMAGES] Uploaded ${urls.length} images to assets/${folder} in ${totalTime}ms`);
    return NextResponse.json({ urls }, { status: 200 });
  } catch (error: unknown) {
    const totalTime = Date.now() - requestStartTime;
    const err = error as { message?: string; type?: string; title?: string; status?: number; detail?: string };
    console.error("[ADMIN UPLOAD IMAGES] POST Error:", err?.message, `${totalTime}ms`);
    return NextResponse.json(
      {
        type: err?.type ?? "https://api.shop.am/problems/internal-error",
        title: err?.title ?? "Internal Server Error",
        status: err?.status ?? 500,
        detail: err?.detail ?? err?.message ?? "An error occurred",
        instance: req.url,
      },
      { status: err?.status ?? 500 }
    );
  }
}

