'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n-client';
import { apiClient } from '../../lib/api-client';

interface PublicBlogPost {
  id: string;
  slug: string;
  title: string;
  contentHtml: string | null;
  excerpt: string | null;
  publishedAt: string | null;
}

export default function BlogPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const [posts, setPosts] = useState<PublicBlogPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  async function loadPosts() {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: PublicBlogPost[] }>('/api/v1/blog', {
        params: { lang },
      });
      setPosts(response.data || []);
    } catch (error) {
      console.error('❌ [BLOG] Failed to load posts', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">{t('blog.loading')}</p>
            </div>
          </div>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-center text-gray-500 text-sm md:text-base">
            {t('blog.empty')}
          </p>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-8">
            {posts.map((post) => {
              const publishedLabel = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString()
                : '';

              return (
                <article
                  key={post.id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                >
                  <header className="mb-3">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
                      {post.title}
                    </h2>
                    {publishedLabel && (
                      <p className="text-xs text-gray-400">
                        {t('blog.publishedAt').replace('{date}', publishedLabel)}
                      </p>
                    )}
                  </header>

                  {post.excerpt && (
                    <p className="text-sm md:text-base text-gray-700 mb-3">
                      {post.excerpt}
                    </p>
                  )}

                  {post.contentHtml && (
                    <div
                      className="prose prose-sm md:prose max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                    />
                  )}

                  {!post.contentHtml && (
                    <button
                      type="button"
                      onClick={() => router.push(`/blog/${post.slug}`)}
                      className="mt-3 inline-flex items-center text-sm font-medium text-[#00d1ff] hover:text-[#00b8e6]"
                    >
                      {t('blog.readMore')}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
