'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { processImageUrl } from '../lib/utils/image-utils';
import { useTranslation } from '../lib/i18n-client';
import { sanitizeHtml } from '../lib/sanitize';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  contentHtml: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface BlogArticleContentProps {
  post: BlogPost;
}

const HY_MONTHS = [
  'հունվարի',
  'փետրվարի',
  'մարտի',
  'ապրիլի',
  'մայիսի',
  'հունիսի',
  'հուլիսի',
  'օգոստոսի',
  'սեպտեմբերի',
  'հոկտեմբերի',
  'նոյեմբերի',
  'դեկտեմբերի',
] as const;

function formatPublishedDate(dateValue: string): string {
  const date = new Date(dateValue);
  const day = date.getUTCDate();
  const month = HY_MONTHS[date.getUTCMonth()] ?? '';
  const year = date.getUTCFullYear();
  return `${day} ${month}, ${year} թ.`;
}

// Component to process internal links in content
function processInternalLinks(html: string): string {
  if (!html) return '';

  // Process product links: /products/product-slug
  let processed = html.replace(
    /href=["']\/products\/([^"']+)["']/g,
    (match, slug) => {
      return `href="/products/${slug}" class="text-[#00d1ff] hover:underline"`;
    }
  );

  // Process blog links: /blog/article-slug
  processed = processed.replace(
    /href=["']\/blog\/([^"']+)["']/g,
    (match, slug) => {
      return `href="/blog/${slug}" class="text-[#00d1ff] hover:underline"`;
    }
  );

  // Process page links: /page-slug (common pages)
  processed = processed.replace(
    /href=["']\/(about|contact|delivery|shipping|returns|faq|support|stores|privacy|terms)["']/g,
    (match, page) => {
      return `href="/${page}" class="text-[#00d1ff] hover:underline"`;
    }
  );

  return processed;
}

// Component to ensure proper heading structure
function ensureHeadingStructure(html: string): string {
  if (!html) return '';

  // Replace any h1 tags with h2 (since title is already h1)
  let processed = html.replace(/<h1([^>]*)>/gi, '<h2$1>');
  processed = processed.replace(/<\/h1>/gi, '</h2>');

  return processed;
}

export function BlogArticleContent({ post }: BlogArticleContentProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const imageUrl = post.featuredImage ? processImageUrl(post.featuredImage) : null;
  const formattedDate = post.publishedAt
    ? formatPublishedDate(post.publishedAt)
    : null;

  // Process content: internal links, heading structure, then sanitize for XSS (3.1a)
  const processedContent = sanitizeHtml(
    ensureHeadingStructure(processInternalLinks(post.contentHtml || ''))
  );

  return (
    <div className="min-h-screen">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/blog')}
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t('blog.backToBlog')}
        </button>

        {/* Featured Image — contain mode on /blog/slug */}
        {imageUrl && (
          <div className="w-full mb-8 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={post.title}
              className="w-full max-w-full max-h-[360px] sm:max-h-[420px] md:max-h-[520px] h-auto object-contain block rounded-lg"
              loading="eager"
              decoding="async"
            />
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          {formattedDate && (
            <time
              dateTime={post.publishedAt || undefined}
              className="text-sm text-gray-500"
            >
              {formattedDate}
            </time>
          )}
        </header>

        {/* Excerpt */}
        {post.excerpt && (
          <div className="mb-8 p-4 bg-blue-50 border-l-4 border-[#00d1ff] rounded">
            <p className="text-lg text-gray-700 italic">{post.excerpt}</p>
          </div>
        )}

        {/* Article Content — images full width of blog */}
        {processedContent && (
          <div
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-[#00d1ff] prose-a:no-underline hover:prose-a:underline prose-img:w-full prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:shadow-md prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:my-2"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        )}

        {/* Back to Blog Link */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/blog"
            className="inline-flex items-center text-[#00d1ff] hover:underline font-medium"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t('blog.backToBlog')}
          </Link>
        </div>
      </article>
    </div>
  );
}

