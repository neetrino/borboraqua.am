import { NextRequest, NextResponse } from 'next/server';
import { db } from '@white-shop/db';
import { processImageUrl } from '@/lib/utils/image-utils';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;

export interface InstantSearchResult {
  id: string;
  name: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  image: string | null;
  category: string;
  slug: string;
  type: 'product';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') ?? '';
  const rawLimit = searchParams.get('limit');
  const limit = Math.min(
    MAX_LIMIT,
    rawLimit ? Math.max(1, parseInt(rawLimit, 10)) : DEFAULT_LIMIT
  );
  const lang = searchParams.get('lang') ?? 'en';

  if (!query || typeof query !== 'string') {
    return NextResponse.json(
      { results: [] },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  }

  const searchQuery = query.toLowerCase().trim();
  if (searchQuery.length === 0) {
    return NextResponse.json(
      { results: [] },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  }

  try {
    const products = await db.product.findMany({
      where: {
        published: true,
        deletedAt: null,
        OR: [
          {
            translations: {
              some: {
                locale: lang,
                title: { contains: searchQuery, mode: 'insensitive' },
              },
            },
          },
          {
            translations: {
              some: {
                locale: lang,
                subtitle: { contains: searchQuery, mode: 'insensitive' },
              },
            },
          },
          {
            translations: {
              some: {
                locale: lang,
                descriptionHtml: { contains: searchQuery, mode: 'insensitive' },
              },
            },
          },
          {
            variants: {
              some: {
                sku: { contains: searchQuery, mode: 'insensitive' },
              },
            },
          },
        ],
      },
      take: limit * 2,
      include: {
        translations: {
          where: { locale: lang },
          select: { title: true, subtitle: true, descriptionHtml: true, slug: true },
        },
        variants: {
          where: { published: true },
          select: { price: true, compareAtPrice: true },
          orderBy: { price: 'asc' as const },
          take: 1,
        },
        categories: {
          select: {
            translations: { where: { locale: lang }, select: { title: true } },
          },
          take: 1,
        },
      },
    });

    const results: InstantSearchResult[] = products.map((p) => {
      const tr = Array.isArray(p.translations) ? p.translations[0] : null;
      const title = tr?.title ?? '';
      const subtitle = tr?.subtitle ?? null;
      const descriptionHtml = tr?.descriptionHtml ?? null;
      const slug = tr?.slug ?? '';
      const variant = Array.isArray(p.variants) ? p.variants[0] : null;
      const price = variant?.price ?? 0;
      const compareAtPrice = variant?.compareAtPrice ?? null;
      const categoryRow = Array.isArray(p.categories) ? p.categories[0] : null;
      const catTr = categoryRow?.translations?.[0];
      const category = catTr?.title ?? '';

      const description = descriptionHtml
        ? descriptionHtml.replace(/<[^>]*>/g, '').slice(0, 120).trim() || null
        : null;

      let image: string | null = null;
      if (Array.isArray(p.media) && p.media.length > 0) {
        const first = processImageUrl(p.media[0]);
        image = first || null;
      }

      return {
        id: p.id,
        name: title,
        description,
        price,
        salePrice: compareAtPrice,
        image,
        category,
        slug,
        type: 'product' as const,
      };
    });

    const byRelevance = [...results].sort((a, b) => {
      const q = searchQuery;
      const score = (r: InstantSearchResult) => {
        if (r.name.toLowerCase().includes(q)) return 3;
        if (r.description?.toLowerCase().includes(q)) return 1;
        return 2;
      };
      return score(b) - score(a);
    });

    const finalResults = byRelevance.slice(0, limit);

    return NextResponse.json(
      { results: finalResults },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  } catch (error) {
    console.error('❌ [SEARCH INSTANT] Error:', error);
    const e = error as Error;
    return NextResponse.json(
      {
        error: 'Search failed',
        results: [],
        details: e.message,
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      }
    );
  }
}
