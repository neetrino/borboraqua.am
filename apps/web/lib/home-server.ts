/**
 * Server-only home page data fetch for RSC.
 * Uses unstable_cache like product-server / blog-server (revalidate: 60s).
 */

import { unstable_cache } from 'next/cache';
import { productsService } from './services/products.service';

const HOME_REVALIDATE = 120;

export type HomeProductItem = {
  id: string;
  slug: string;
  title?: string;
  subtitle?: string | null;
  media?: Array<{ url?: string; type?: string } | string>;
  variants?: Array<{
    id: string;
    sku: string;
    price: number;
    originalPrice?: number | null;
    stock?: number;
    imageUrl?: string | null;
  }>;
  [key: string]: unknown;
};

export type HomePageData = {
  featured: HomeProductItem[];
  kids: HomeProductItem[];
};

/**
 * Fetch home page featured + kids products on the server (for Home page RSC).
 * Result is cached with unstable_cache (revalidate: 60s).
 */
export async function getHomePageData(lang: string): Promise<HomePageData> {
  const result = await unstable_cache(
    async () => {
      const [featuredRes, kidsRes] = await Promise.all([
        productsService.findAll({
          filter: 'featured',
          limit: 9,
          page: 1,
          lang,
          listOnly: true,
        }),
        productsService.findAll({
          search: 'kids',
          limit: 10,
          page: 1,
          lang,
          listOnly: true,
        }),
      ]);
      const featured = featuredRes.data ?? [];
      let kids = kidsRes.data ?? [];
      if (kids.length === 0 && featured.length > 0) {
        kids = featured.slice(0, 10);
      }
      return { featured, kids };
    },
    ['home', lang],
    { revalidate: HOME_REVALIDATE }
  )();
  return result as HomePageData;
}
