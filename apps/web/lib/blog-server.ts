/**
 * Server-only blog fetch for RSC.
 * Uses unstable_cache like product-server (revalidate: 60s).
 */

import { unstable_cache } from 'next/cache';
import { blogService } from './services/blog.service';

const BLOG_POST_REVALIDATE = 900; // 15 minutes

export type BlogPostServer = {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string | null;
  contentHtml: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featuredImage: string | null;
  ogImage: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type BlogListServerItem = {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string | null;
  contentHtml: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featuredImage: string | null;
  ogImage: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type BlogListServerResponse = {
  data: BlogListServerItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/**
 * Fetch blog post by slug on the server (for Server Components).
 * Result is cached with unstable_cache (revalidate: 60s).
 */
export async function getBlogPostBySlugServer(
  slug: string,
  lang: string
): Promise<BlogPostServer | null> {
  try {
    const result = await unstable_cache(
      () => blogService.getBySlug(slug, lang),
      ['blog-slug', slug, lang],
      { revalidate: BLOG_POST_REVALIDATE }
    )();
    return result as BlogPostServer | null;
  } catch {
    return null;
  }
}

/**
 * Fetch blog list on the server so the page can render
 * with ready HTML instead of waiting for a client-side API request.
 */
export async function getBlogListServer(
  lang: string,
  page: number,
  limit: number
): Promise<BlogListServerResponse> {
  try {
    // Do not wrap the blog list in unstable_cache.
    // The payload can exceed Next.js 2MB cache limit because some posts
    // may contain large inline image data. The service itself already keeps
    // posts in an in-memory cache, so the page remains fast without crashing.
    return (await blogService.listPublished(
      lang,
      page,
      limit
    )) as BlogListServerResponse;
  } catch {
    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }
}
