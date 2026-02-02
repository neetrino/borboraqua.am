import Link from 'next/link';
import { Button } from '@shop/ui';
import { getStoredLanguage } from '../../lib/language';
import { t } from '../../lib/i18n';

import { ProductsGrid } from '../../components/ProductsGrid';
import { ProductsHero } from '../../components/ProductsHero';
import { productsService } from '../../lib/services/products.service';

const PAGE_CONTAINER = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  inStock: boolean;
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
 * Fetch products (PRODUCTION SAFE)
 * Directly calls the service instead of HTTP fetch for better reliability on Vercel
 */
async function getProducts(
  page: number = 1,
  search?: string,
  limit: number = 24
): Promise<ProductsResponse> {
  try {
    const language = getStoredLanguage();
    
    // Build filters object for productsService
    const filters = {
      page,
      limit,
      lang: language,
      search: search?.trim() || undefined,
    };

    console.log("🌐 [PRODUCTS] Fetch products directly from service", { filters });

    // Directly call the service instead of HTTP fetch
    // This works better on Vercel since we're already on the server side
    const result = await productsService.findAll(filters);

    if (!result.data || !Array.isArray(result.data)) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 24, totalPages: 0 }
      };
    }

    return result;

  } catch (e) {
    console.error("❌ PRODUCT ERROR", e);
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 24, totalPages: 0 }
    };
  }
}

/**
 * PAGE
 */
export default async function ProductsPage({ searchParams }: any) {
  const params = searchParams ? await searchParams : {};
  const page = parseInt(params?.page || "1", 10);
  const limitParam = params?.limit?.toString().trim();
  const parsedLimit = limitParam && !Number.isNaN(parseInt(limitParam, 10))
    ? parseInt(limitParam, 10)
    : null;
  // Default to 24 products per page for better performance
  // If limit is >= 1000, treat as "all" (show all products, but cap at 1000)
  const perPage = parsedLimit 
    ? (parsedLimit >= 1000 ? 2000 : parsedLimit)
    : 2000;

  const productsData = await getProducts(
    page,
    params?.search,
    perPage
  );

  // ------------------------------------
  // 🔧 FIX: normalize products 
  // add missing inStock, missing image fields 
  // ------------------------------------
  const normalizedProducts = productsData.data.map((p: any) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? p.originalPrice ?? null,
    image: p.image ?? null,
    inStock: p.inStock ?? true,      // ⭐ FIXED
    brand: p.brand ?? null,
    colors: p.colors ?? [],          // ⭐ Add colors array
    labels: p.labels ?? []            // ⭐ Add labels array (includes "Out of Stock" label)
  }));

  // PAGINATION
  const buildPaginationUrl = (num: number) => {
    const q = new URLSearchParams();
    q.set("page", num.toString());
    // Preserve search parameter if exists
    if (params?.search) {
      q.set("search", String(params.search));
    }
    return `/products?${q.toString()}`;
  };

  // Get language for translations
  const language = getStoredLanguage();

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
                <div className="mt-8 flex justify-center gap-2">
                  {page > 1 && <Link href={buildPaginationUrl(page - 1)}><Button variant="outline">{t(language, 'common.pagination.previous')}</Button></Link>}
                  <span>{t(language, 'common.pagination.pageOf').replace('{page}', page.toString()).replace('{totalPages}', productsData.meta.totalPages.toString())}</span>
                  {page < productsData.meta.totalPages && <Link href={buildPaginationUrl(page + 1)}><Button variant="outline">{t(language, 'common.pagination.next')}</Button></Link>}
                </div>
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


