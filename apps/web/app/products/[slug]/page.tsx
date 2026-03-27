import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getProductBySlugServer } from '../../../lib/product-server';
import { getStoredLanguage } from '../../../lib/language';
import { ProductPageClient, type Product } from './ProductPageClient';

const RESERVED_ROUTES = ['admin', 'login', 'register', 'cart', 'checkout', 'profile', 'orders', 'categories', 'products', 'about', 'contact', 'delivery', 'shipping', 'returns', 'faq', 'questions', 'support', 'stores', 'privacy', 'terms'];

interface ProductPageProps {
  params: Promise<{ slug?: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug ?? '';
  const slugParts = slug.includes(':') ? slug.split(':') : [slug];
  const slugPart = slugParts[0];
  const variantIdFromUrl = slugParts.length > 1 ? slugParts[1] : null;

  if (!slugPart) {
    return null;
  }

  if (RESERVED_ROUTES.includes(slugPart.toLowerCase())) {
    redirect(`/${slugPart}`);
  }

  let lang = 'hy';
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get('shop_language');

    if (langCookie?.value && ['hy', 'en', 'ru'].includes(langCookie.value)) {
      lang = langCookie.value;
    } else {
      lang = getStoredLanguage();
    }
  } catch {
    lang = getStoredLanguage();
  }

  const initialProduct = await getProductBySlugServer(slugPart, lang);

  return (
    <ProductPageClient
      initialProduct={initialProduct as Product | null}
      slug={slugPart}
      variantIdFromUrl={variantIdFromUrl}
    />
  );
}
