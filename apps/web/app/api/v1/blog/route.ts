import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { blogService } from "@/lib/services/blog.service";

const BLOG_LIST_REVALIDATE = 900; // 15 minutes

/**
 * GET /api/v1/blog
 * Public blog posts list (cached like products).
 *
 * Query params:
 * - lang: string (optional, default: "en")
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 10)
 */
export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now();
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    const result = await unstable_cache(
      () => blogService.listPublished(lang, page, limit),
      ["blog-list", lang, String(page), String(limit)],
      { revalidate: BLOG_LIST_REVALIDATE }
    )();

    // Guard against stale cached empty responses for a specific locale.
    // If cache says empty, verify once with a direct read before returning.
    if (result.data.length === 0) {
      const freshResult = await blogService.listPublished(lang, page, limit);
      if (freshResult.data.length > 0) {
        return NextResponse.json(freshResult);
      }
    }
    
    const duration = Date.now() - startTime;
    // Only log if response is slow
    if (duration > 1000) {
      console.warn(`⚠️ [BLOG API] Slow response: ${duration}ms for ${result.data.length} posts`);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [PUBLIC BLOG] GET Error:", error);
    return NextResponse.json(
      {
        type: error.type || "https://api.shop.am/problems/internal-error",
        title: error.title || "Internal Server Error",
        status: error.status || 500,
        detail: error.detail || error.message || "An error occurred",
        instance: req.url,
      },
      { status: error.status || 500 }
    );
  }
}


