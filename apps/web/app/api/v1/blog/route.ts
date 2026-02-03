import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/services/blog.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/blog
 * Public blog posts list
 *
 * Query params:
 * - lang: string (optional, default: "en")
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";

    const posts = await blogService.listPublished(lang);

    return NextResponse.json({ data: posts });
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


