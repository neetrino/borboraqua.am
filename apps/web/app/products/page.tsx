import { getStoredLanguage, type LanguageCode } from '../../lib/language';
import { t } from '../../lib/i18n';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';

import { ProductsGrid } from '../../components/ProductsGrid';
import { ProductsHero } from '../../components/ProductsHero';
import { ProductsPagination } from '../../components/ProductsPagination';
import { productsService } from '../../lib/services/products.service';

/** Cache revalidate (seconds). */
const PRODUCTS_PAGE_REVALIDATE = 60;

const MAX_COLORS_PER_PRODUCT = 20;

interface Product {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null; // Primary category title
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  inStock: boolean;
  minimumOrderQuantity?: number;
  orderQuantityIncrement?: number;
  defaultVariantId?: string | null;
  brand: {
    id: string;
    name: string;
  } | null;
  labels?: Array<{
    id: string;
    type: 'text' | 'percentage';
    value: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    color: string | null;
  }>;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
}

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Trim product to grid-only fields so cached payload stays under Next.js 2MB limit.
 */
function trimProductForGrid(p: {
  id: string;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  price?: number;
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  image?: string | null;
  inStock?: boolean;
  minimumOrderQuantity?: number;
  orderQuantityIncrement?: number;
  defaultVariantId?: string | null;
  brand?: { id: string; name: string } | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  labels?: unknown[];
}): Product {
  const colors = Array.isArray(p.colors) ? p.colors.slice(0, MAX_COLORS_PER_PRODUCT) : [];
  return {
    id: p.id,
    slug: p.slug ?? '',
    title: p.title ?? '',
    description: p.description ?? null,
    category: p.category ?? null,
    price: p.price ?? 0,
    compareAtPrice: p.compareAtPrice ?? p.originalPrice ?? null,
    image: p.image ?? null,
    inStock: p.inStock ?? true,
    minimumOrderQuantity: p.minimumOrderQuantity ?? 1,
    orderQuantityIncrement: p.orderQuantityIncrement ?? 1,
    defaultVariantId: p.defaultVariantId ?? null,
    brand: p.brand ?? null,
    labels: (p.labels ?? []) as Product['labels'],
    colors,
  };
}

/**
 * Fetch products with cache. We cache only the trimmed response (grid fields) to stay under 2MB.
 */
async function getProducts(
  page: number = 1,
  search?: string,
  limit: number = 24
): Promise<ProductsResponse> {
  try {
    let language: string = 'hy';
    try {
      const cookieStore = await cookies();
      const langCookie = cookieStore.get('shop_language');
      if (langCookie?.value && ['hy', 'en', 'ru'].includes(langCookie.value)) {
        language = langCookie.value;
      } else {
        language = getStoredLanguage();
      }
    } catch {
      language = getStoredLanguage();
    }

    const filters = {
      page,
      limit,
      lang: language,
      search: search?.trim() || undefined,
      listOnly: true, // Use listOnly mode to get category field
    };

    const result = await unstable_cache(
      async () => {
        const raw = await productsService.findAll(filters);
        if (!raw.data || !Array.isArray(raw.data)) {
          return { data: [], meta: { total: 0, page: 1, limit: 24, totalPages: 0 } };
        }
        return {
          data: raw.data.map(trimProductForGrid),
          meta: raw.meta,
        };
      },
      ['products-page', language, String(page), String(limit), search?.trim() ?? '', 'listOnly'],
      { revalidate: PRODUCTS_PAGE_REVALIDATE }
    )();

    if (!result.data || !Array.isArray(result.data)) {
      return { data: [], meta: { total: 0, page: 1, limit: 24, totalPages: 0 } };
    }
    return result;
  } catch (e) {
    console.error('❌ PRODUCT ERROR', e);
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 24, totalPages: 0 },
    };
  }
}

/**
 * PAGE
 */
export default async function ProductsPage({ searchParams }: any) {
  const params = searchParams ? await searchParams : {};
  const page = parseInt(params?.page || "1", 10);
  // Show 9 products per page on desktop, 8 on mobile
  const perPage = 9;

  const productsData = await getProducts(page, params?.search, perPage);
  const normalizedProducts = productsData.data;

  // Get language for translations - try cookies first, then fallback
  let language: LanguageCode = 'hy';
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get('shop_language');
    if (langCookie?.value && ['hy', 'en', 'ru'].includes(langCookie.value)) {
      language = langCookie.value as LanguageCode;
    } else {
      language = getStoredLanguage();
    }
  } catch {
    language = getStoredLanguage();
  }

  return (
    <div className="w-full overflow-x-hidden max-w-full">
      {/* Products Hero Section - Figma Design */}
      <div className="max-w-7xl mx-auto pl-4 sm:pl-6 lg:pl-8 pr-0 sm:pr-2 lg:pr-4">
        <ProductsHero total={productsData.meta.total} />
      </div>

      <div className="max-w-7xl mx-auto pl-2 sm:pl-4 md:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8">
        <div className="w-full py-4 overflow-x-hidden">

          {normalizedProducts.length > 0 ? (
            <>
              <ProductsGrid products={normalizedProducts} sortBy={params?.sort || "default"} />

              {productsData.meta.totalPages > 1 && (
                <ProductsPagination
                  currentPage={page}
                  totalPages={productsData.meta.totalPages}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{t(language, 'common.messages.noProductsFound')}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


