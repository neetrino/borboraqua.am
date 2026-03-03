'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '../../lib/i18n-client';
import { apiClient } from '../../lib/api-client';
import { getBlogFromCache, setBlogCache } from '../../lib/blog-cache';
import { BlogCard } from '../../components/BlogCard';
import { BlogPagination } from '../../components/BlogPagination';

interface PublicBlogPost {
  id: string;
  slug: string;
  title: string;
  contentHtml: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
}

interface BlogListResponse {
  data: PublicBlogPost[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function BlogPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<PublicBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<BlogListResponse['meta'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const limit = 6;

  useEffect(() => {
    let cancelled = false;

    async function loadPosts(backgroundRevalidate = false) {
      try {
        if (!backgroundRevalidate) {
          setLoading(true);
          setError(null);
        }

        // Use cached blog list (like products/cart) for instant display
        if (!backgroundRevalidate) {
          const cached = getBlogFromCache(lang, currentPage, limit);
          if (cached) {
            setPosts(cached.data as PublicBlogPost[]);
            setMeta(cached.meta);
            setLoading(false);
            loadPosts(true);
            return;
          }
        }

        const response = await apiClient.get<BlogListResponse>('/api/v1/blog', {
          params: { lang, page: String(currentPage), limit: String(limit) },
        });

        if (!cancelled) {
          setPosts(response.data || []);
          setMeta(response.meta || null);
          setBlogCache(lang, currentPage, limit, response.data || [], response.meta || { total: 0, page: currentPage, limit, totalPages: 0 });
        }
      } catch (err: any) {
        if (!cancelled && !backgroundRevalidate) {
          console.error('❌ [BLOG] Failed to load posts', err);
          const errorMessage = err?.message?.includes('timeout')
            ? 'Request timeout. Please try again.'
            : t('blog.errorLoading');
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, currentPage]);


  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-sm md:text-base font-semibold uppercase tracking-wider text-[#00d1ff] mb-2">
            {t('blog.subtitle')}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            {t('blog.title')}
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            {t('blog.description')}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">{t('blog.loading')}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm md:text-base">
              {t('blog.empty')}
            </p>
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && !error && posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <BlogCard
                  key={post.id}
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  featuredImage={post.featuredImage}
                  publishedAt={post.publishedAt}
                />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <BlogPagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
