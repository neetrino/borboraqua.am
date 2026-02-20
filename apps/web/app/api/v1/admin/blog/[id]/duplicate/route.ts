import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { blogService } from "@/lib/services/blog.service";

/**
 * POST /api/v1/admin/blog/[id]/duplicate
 * Duplicate a blog post (create a copy as draft)
 */
export async function POST(
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
    console.log("📋 [ADMIN BLOG] Duplicate request:", id);

    // Get the original post with all translations
    const originalPost = await blogService.getAdminPost(id, user.locale || "en", true);
    if (!originalPost) {
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

    // Generate new slug with -copy suffix
    const generateNewSlug = (originalSlug: string): string => {
      const timestamp = Date.now();
      return `${originalSlug}-copy-${timestamp}`;
    };

    // Prepare duplicate data
    const newSlug = generateNewSlug(originalPost.slug || `post-${id}`);
    
    // Get all translations from original post
    const translations = (originalPost as any).translations || [];
    
    // If no translations array, create from single post data
    const duplicateTranslations = translations.length > 0
      ? translations.map((t: any) => ({
          locale: t.locale,
          title: `${t.title} (Copy)`,
          contentHtml: t.contentHtml || null,
          excerpt: t.excerpt || null,
          seoTitle: t.seoTitle || null,
          seoDescription: t.seoDescription || null,
          featuredImage: t.featuredImage || null,
          ogImage: t.ogImage || null,
        }))
      : [
          {
            locale: originalPost.locale || "en",
            title: `${originalPost.title} (Copy)`,
            contentHtml: (originalPost as any).contentHtml || null,
            excerpt: (originalPost as any).excerpt || null,
            seoTitle: (originalPost as any).seoTitle || null,
            seoDescription: (originalPost as any).seoDescription || null,
            featuredImage: (originalPost as any).featuredImage || null,
            ogImage: (originalPost as any).ogImage || null,
          },
        ];

    // Create the duplicate post as draft
    const duplicatedPost = await blogService.createPost({
      slug: newSlug,
      published: false, // Always create as draft
      translations: duplicateTranslations,
    });

    console.log("✅ [ADMIN BLOG] Post duplicated:", {
      originalId: id,
      newId: duplicatedPost?.id,
    });

    // Get the full post data with locale for admin list
    const locale = user.locale || "en";
    const fullPost = await blogService.getAdminPost(duplicatedPost.id, locale);

    // Return the complete post data
    return NextResponse.json(
      fullPost || duplicatedPost,
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ [ADMIN BLOG] Duplicate Error:", error);
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


