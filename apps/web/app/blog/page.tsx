import { cookies } from 'next/headers';
import { BlogCard } from '../../components/BlogCard';
import { BlogPagination } from '../../components/BlogPagination';
import { getBlogListServer } from '../../lib/blog-server';
import { t } from '../../lib/i18n';
import { DEFAULT_LANGUAGE, type LanguageCode } from '../../lib/language';

interface BlogPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSearchParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function getPageLanguage(): Promise<LanguageCode> {
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get('shop_language');
    if (langCookie?.value && ['hy', 'en', 'ru'].includes(langCookie.value)) {
      return langCookie.value as LanguageCode;
    }
  } catch {
    // Ignore cookie access issues and use the default language.
  }

  return DEFAULT_LANGUAGE;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = searchParams ? await searchParams : {};
  const rawPage = getSearchParamValue(params.page);
  const parsedPage = Number.parseInt(rawPage ?? '1', 10);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = 6;
  const language = await getPageLanguage();
  const response = await getBlogListServer(language, currentPage, limit);
  const readMoreLabel = t(language, 'blog.readMore');

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-sm md:text-base font-semibold uppercase tracking-wider text-[#00d1ff] mb-2">
            {t(language, 'blog.subtitle')}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            {t(language, 'blog.title')}
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            {t(language, 'blog.description')}
          </p>
        </div>

        {/* Empty State */}
        {response.data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm md:text-base">
              {t(language, 'blog.empty')}
            </p>
          </div>
        )}

        {/* Blog Posts Grid */}
        {response.data.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {response.data.map((post) => (
                <BlogCard
                  key={post.id}
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  featuredImage={post.featuredImage}
                  publishedAt={post.publishedAt}
                  readMoreLabel={readMoreLabel}
                />
              ))}
            </div>

            {/* Pagination */}
            {response.meta.totalPages > 1 && (
              <BlogPagination
                currentPage={response.meta.page}
                totalPages={response.meta.totalPages}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
