import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { blogService } from "@/lib/services/blog.service";

/**
 * GET /api/v1/admin/blog/[id]
 * Get single blog post for admin
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") || user.locale || "en";

    const post = await blogService.getAdminPost(id, locale);
    if (!post) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/not-found",
          title: "Not Found",
          status: 404,
          detail: "Blog post not found",
          instance: req.url,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("❌ [ADMIN BLOG] GET BY ID Error:", error);
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
 * PUT /api/v1/admin/blog/[id]
 * Update blog post
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    let body: any;
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

    const updated = await blogService.updatePost({
      id,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      published:
        typeof body.published === "boolean" ? body.published : undefined,
      locale:
        typeof body.locale === "string" && body.locale.trim()
          ? body.locale
          : user.locale || "en",
      title: typeof body.title === "string" ? body.title : undefined,
      contentHtml:
        typeof body.contentHtml === "string" ? body.contentHtml : undefined,
      excerpt: typeof body.excerpt === "string" ? body.excerpt : undefined,
      seoTitle:
        typeof body.seoTitle === "string" ? body.seoTitle : undefined,
      seoDescription:
        typeof body.seoDescription === "string"
          ? body.seoDescription
          : undefined,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("❌ [ADMIN BLOG] PUT Error:", error);
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
 * DELETE /api/v1/admin/blog/[id]
 * Soft-delete blog post
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    await blogService.deletePost(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ [ADMIN BLOG] DELETE Error:", error);
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



