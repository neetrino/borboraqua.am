import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { uploadToR2, isR2Configured } from "@/lib/r2-client";
import { randomUUID } from "crypto";

/**
 * POST /api/v1/admin/products/upload-images
 * Upload images to R2 and return public URLs.
 *
 * Request body: { images: string[] } (base64 data:image/... strings)
 * Response: { urls: string[] } (R2 public URLs)
 */
export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();

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

    let body: { images?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Invalid JSON in request body",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'images' is required and must be a non-empty array",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const validImages: string[] = [];
    for (let i = 0; i < body.images.length; i++) {
      const image = body.images[i];
      if (typeof image !== "string" || !image.startsWith("data:image/")) {
        return NextResponse.json(
          {
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            status: 400,
            detail: `Image at index ${i} must be a valid base64 image (data:image/...)`,
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

    const urls: string[] = [];
    for (let i = 0; i < validImages.length; i++) {
      const dataUrl = validImages[i];
      const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
      if (!match) {
        urls.push("");
        continue;
      }
      const contentType = match[1];
      const base64Data = match[2];
      const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
      const key = `assets/products/${randomUUID()}-${i}.${ext}`;
      const buffer = Buffer.from(base64Data, "base64");
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
    console.log(`[ADMIN UPLOAD IMAGES] Uploaded ${urls.length} images in ${totalTime}ms`);
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

