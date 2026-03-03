/**
 * Server-only product fetch for RSC.
 * Calls productsService directly (Prisma) — no HTTP round-trip.
 */

import { unstable_cache } from 'next/cache';
import { productsService } from './services/products.service';

const PRODUCT_REVALIDATE = 60;

export type ProductServer = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  media: Array<{ url?: string; type?: string }> | string[];
  variants: Array<{
    id: string;
    sku: string;
    price: number;
    originalPrice?: number | null;
    compareAtPrice?: number;
    stock: number;
    available: boolean;
    options: Array<{ attribute: string; value: string; key: string; valueId?: string; attributeId?: string }>;
    productDiscount?: number | null;
    globalDiscount?: number | null;
    imageUrl?: string;
  }>;
  labels?: Array<{ id: string; type: string; value: string; position: string; color: string | null }>;
  brand?: { id: string; name: string };
  categories?: Array<{ id: string; slug: string; title: string }>;
  productAttributes?: unknown[];
  productDiscount?: number | null;
  globalDiscount?: number | null;
  minimumOrderQuantity?: number;
  orderQuantityIncrement?: number;
};

/**
 * Fetch product by slug on the server (for Server Components).
 * Uses direct Prisma access via productsService — no HTTP hop.
 * Result is cached with unstable_cache (revalidate: 60s).
 * Returns null on 404 or any error.
 */
export async function getProductBySlugServer(
  slug: string,
  lang: string
): Promise<ProductServer | null> {
  try {
    const result = await unstable_cache(
      () => productsService.findBySlug(slug, lang),
      [`product-slug`, slug, lang],
      { revalidate: PRODUCT_REVALIDATE }
    )();
    return result as ProductServer;
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e?.status === 404) return null;
    return null;
  }
}

/**
 * Parse Accept-Language header to preferred lang (hy, en, etc.).
 */
export function getPreferredLangFromHeaders(acceptLanguage: string | null): string {
  if (!acceptLanguage) return 'hy';
  const parts = acceptLanguage.split(',').map((s) => s.trim().split(';')[0]);
  for (const p of parts) {
    const code = p.slice(0, 2).toLowerCase();
    if (code === 'hy' || code === 'en' || code === 'ru') return code;
  }
  return 'hy';
}
