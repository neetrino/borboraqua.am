import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/services/blog.service";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Always fetch fresh data

/**
 * GET /api/v1/blog
 * Public blog posts list
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
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    console.log(`📝 [BLOG API] Fetching posts: lang=${lang}, page=${page}, limit=${limit}`);
    
    const result = await blogService.listPublished(lang, page, limit);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [BLOG API] Posts fetched in ${duration}ms: ${result.data.length} posts`);

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


