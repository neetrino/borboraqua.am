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
