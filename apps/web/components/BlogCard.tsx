'use client';

import Link from 'next/link';
import { processImageUrl } from '../lib/utils/image-utils';
import { useTranslation } from '../lib/i18n-client';

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  publishedAt?: string | null;
  className?: string;
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

export function BlogCard({
  slug,
  title,
  excerpt,
  featuredImage,
  publishedAt,
  className = '',
}: BlogCardProps) {
  const { t } = useTranslation();
  const imageUrl = featuredImage ? processImageUrl(featuredImage) : null;
  const formattedDate = publishedAt ? formatPublishedDate(publishedAt) : null;

  return (
    <article
      className={`group border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-all duration-300 ${className}`}
    >
      <Link href={`/blog/${slug}`} prefetch className="block">
        {imageUrl && (
          <div className="w-full overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-auto block group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        <div className="p-4 sm:p-6">
          {formattedDate && (
            <time
              dateTime={publishedAt || undefined}
              className="text-xs text-gray-500 mb-2 block"
            >
              {formattedDate}
            </time>
          )}
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 group-hover:text-[#00d1ff] transition-colors line-clamp-2">
            {title}
          </h2>
          {excerpt && (
            <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-3">
              {excerpt}
            </p>
          )}
          <span className="inline-flex items-center text-sm font-medium text-[#00d1ff] group-hover:underline">
            {t('blog.readMore')}
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>
      </Link>
    </article>
  );
}

