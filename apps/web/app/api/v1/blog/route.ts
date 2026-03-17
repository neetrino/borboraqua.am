import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/services/blog.service";

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

    const result = await blogService.listPublished(lang, page, limit);

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


