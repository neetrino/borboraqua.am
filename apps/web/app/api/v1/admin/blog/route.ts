import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { blogService } from "@/lib/services/blog.service";

/**
 * GET /api/v1/admin/blog
 * Get list of blog posts for admin
 *
 * Query params:
 * - locale: string (optional, default: "en")
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") || "en";

    const posts = await blogService.getAdminPosts(locale);
    return NextResponse.json({ data: posts });
  } catch (error: any) {
    console.error("❌ [ADMIN BLOG] GET Error:", error);
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

/**
 * POST /api/v1/admin/blog
 * Create a new blog post (single locale)
 */
export async function POST(req: NextRequest) {
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

    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
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

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'title' is required and must be a non-empty string",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (!body.slug || typeof body.slug !== "string" || !body.slug.trim()) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'slug' is required and must be a non-empty string",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (typeof body.published !== "boolean") {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'published' is required and must be a boolean",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const locale =
      typeof body.locale === "string" && body.locale.trim()
        ? body.locale
        : user.locale || "en";

    const post = await blogService.createPost({
      slug: body.slug.trim(),
      published: body.published,
      locale,
      title: body.title.trim(),
      contentHtml: body.contentHtml,
      excerpt: body.excerpt,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error("❌ [ADMIN BLOG] POST Error:", error);
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


