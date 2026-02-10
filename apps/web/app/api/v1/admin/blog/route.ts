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
 * Create a new blog post with multiple translations
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

    // Validate translations array
    if (!body.translations || !Array.isArray(body.translations) || body.translations.length === 0) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'translations' is required and must be a non-empty array",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    // Validate each translation has at least a title
    for (const trans of body.translations) {
      if (!trans.locale || !trans.title || typeof trans.title !== "string" || !trans.title.trim()) {
        return NextResponse.json(
          {
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            status: 400,
            detail: `Each translation must have 'locale' and 'title' fields. Translation with locale '${trans.locale || 'unknown'}' is missing required fields.`,
            instance: req.url,
          },
          { status: 400 }
        );
      }
    }

    const post = await blogService.createPost({
      slug: body.slug.trim(),
      published: body.published,
      translations: body.translations.map((t: any) => ({
        locale: t.locale,
        title: t.title.trim(),
        contentHtml: t.contentHtml || null,
        excerpt: t.excerpt || null,
        seoTitle: t.seoTitle || null,
        seoDescription: t.seoDescription || null,
        featuredImage: body.featuredImage || null,
        ogImage: body.ogImage || null,
      })),
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



