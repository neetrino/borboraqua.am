import { getStoredLanguage } from '../../lib/language';
import { t } from '../../lib/i18n';

import { ProductsGrid } from '../../components/ProductsGrid';
import { ProductsHero } from '../../components/ProductsHero';
import { ProductsPagination } from '../../components/ProductsPagination';
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
  // Show 9 products per page (3 rows × 3 columns)
  const perPage = 9;

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


