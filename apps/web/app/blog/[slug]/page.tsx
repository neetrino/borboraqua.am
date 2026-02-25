import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { blogService } from '@/lib/services/blog.service';
import { getStoredLanguage } from '@/lib/language';
import { BlogArticleContent } from '@/components/BlogArticleContent';

export const dynamic = 'force-dynamic';

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  // Get language from cookies (server-side) first, then fallback
  let lang: string = 'hy';
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get('shop_language');
    if (langCookie && langCookie.value && ['hy', 'en', 'ru'].includes(langCookie.value)) {
      lang = langCookie.value;
    } else {
      lang = getStoredLanguage() || 'hy';
    }
  } catch {
    lang = getStoredLanguage() || 'hy';
  }
  const post = await blogService.getBySlug(slug, lang);

  if (!post) {
    return {
      title: 'Հոդված չի գտնվել',
    };
  }

  const metaTitle = post.seoTitle || post.title;
  const metaDescription = post.seoDescription || post.excerpt || '';
  const ogImage = post.ogImage || post.featuredImage || '';

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'article',
      images: ogImage ? [{ url: ogImage }] : [],
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProps) {
  const { slug } = await params;
  // Get language from cookies (server-side) first, then fallback
  let lang: string = 'hy';
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get('shop_language');
    if (langCookie && langCookie.value && ['hy', 'en', 'ru'].includes(langCookie.value)) {
      lang = langCookie.value;
    } else {
      lang = getStoredLanguage() || 'hy';
    }
  } catch {
    lang = getStoredLanguage() || 'hy';
  }
  const post = await blogService.getBySlug(slug, lang);

  if (!post) {
    notFound();
  }

  return <BlogArticleContent post={post} />;
}

