import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getProductBySlugServer, getPreferredLangFromHeaders } from '../../../lib/product-server';
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

  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  const lang = getPreferredLangFromHeaders(acceptLanguage);

  const initialProduct = await getProductBySlugServer(slugPart, lang);

  return (
    <ProductPageClient
      initialProduct={initialProduct as Product | null}
      slug={slugPart}
      variantIdFromUrl={variantIdFromUrl}
    />
  );
}
