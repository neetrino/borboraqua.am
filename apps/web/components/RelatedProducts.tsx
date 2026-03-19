'use client';

import { useState, useEffect, useRef, type MouseEvent, type TouchEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { getRelatedProductsFromCache, setRelatedProductsCache, clearRelatedProductsCache } from '../lib/related-products-cache';
import { formatPrice, getStoredCurrency } from '../lib/currency';
import { getStoredLanguage, type LanguageCode } from '../lib/language';
import { t } from '../lib/i18n';
import { useAuth } from '../lib/auth/AuthContext';
import { FeaturedProductCard, type FeaturedProduct, addToCart, FeaturedProductsNavigationArrow } from './icons/global/global';
import { useTranslation } from '../lib/i18n-client';
import { DESKTOP_LAYOUT_MIN_WIDTH } from '../lib/device-layout';
import { showToast } from './Toast';

interface RelatedProduct {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null; // Primary category title (when listOnly=true)
  /** listOnly API returns string[]; full product returns Array<{id,slug,title}> */
  categories?: string[] | Array<{
    id: string;
    slug: string;
    title: string;
  }>;
  price: number;
  originalPrice?: number | null;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  image: string | null;
  inStock: boolean;
  minimumOrderQuantity?: number;
  orderQuantityIncrement?: number;
  defaultVariantId?: string | null;
  brand?: {
    id: string;
    name: string;
  } | null;
  variants?: Array<{
    options?: Array<{
      key: string;
      value: string;
    }>;
  }>;
  labels?: Array<{
    id: string;
    type: 'text' | 'percentage';
    value: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    color: string | null;
    imageUrl?: string | null;
    imagePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
  }>;
}

interface RelatedProductsProps {
  categorySlug?: string;
  currentProductId: string;
}

/**
 * RelatedProducts component - displays products from the same category in a carousel
 * Shown at the bottom of the single product page
 */
export function RelatedProducts({ categorySlug, currentProductId }: RelatedProductsProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t: tClient } = useTranslation();
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  /** Visible cards: 2 when &lt;768px, 3 when 768–1024 and &gt;1024 */
  const [visibleCount, setVisibleCount] = useState(3);
  // Initialize language with default to match server-side and prevent hydration mismatch
  const [language, setLanguage] = useState<LanguageCode>('hy');
  // Initialize currency with 'AMD' to match server-side default and prevent hydration mismatch
  const [currency, setCurrency] = useState<'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL'>('AMD');

  // Initialize language from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    setLanguage(getStoredLanguage());
    
    const handleLanguageUpdate = () => {
      setLanguage(getStoredLanguage());
    };
    
    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, []);

  // Initialize currency from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    setCurrency(getStoredCurrency());
  }, []);

  // Listen for currency updates
  useEffect(() => {
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };
    const handleCurrencyRatesUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    };
  }, []);

  // Up to and including 1024px: mobile productCar layout. Above 1024px: laptop single-page style.
  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${DESKTOP_LAYOUT_MIN_WIDTH - 1}px)`);
    const checkMobile = () => {
      setIsMobile(mediaQuery.matches);
    };

    checkMobile();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkMobile);
      return () => mediaQuery.removeEventListener('change', checkMobile);
    } else {
      mediaQuery.addListener(checkMobile);
      window.addEventListener('resize', checkMobile);
      return () => {
        mediaQuery.removeListener(checkMobile);
        window.removeEventListener('resize', checkMobile);
      };
    }
  }, []);

  // Visible count: 2 when <768px, 3 when 768–1024 and >1024.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setVisibleCount(mq.matches ? 2 : 3);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const fetchRelatedProducts = async (backgroundRevalidate = false) => {
      try {
        if (!backgroundRevalidate) setLoading(true);

        const currentLang = getStoredLanguage();

        // Use cached related products (like blog/cart) for instant carousel
        if (!backgroundRevalidate) {
          const cached = getRelatedProductsFromCache(categorySlug, currentLang);
          if (cached && Array.isArray(cached)) {
            const filtered = (cached as RelatedProduct[]).filter((p) => p.id !== currentProductId);
            setProducts(filtered.slice(0, 10));
            setLoading(false);
            fetchRelatedProducts(true);
            return;
          }
        }

        const params: Record<string, string> = {
          limit: '30',
          lang: currentLang,
          listOnly: 'true',
        };
        if (categorySlug) params.category = categorySlug;

        const response = await apiClient.get<{
          data: RelatedProduct[];
          meta?: { total: number };
        } | RelatedProduct[]>('/api/v1/products', { params });

        const productsArray = Array.isArray(response)
          ? response
          : (response?.data || []);

        setRelatedProductsCache(categorySlug, currentLang, productsArray);

        const filtered = (productsArray as RelatedProduct[]).filter((p) => p.id !== currentProductId);
        setProducts(filtered.slice(0, 10));
      } catch (error) {
        if (!backgroundRevalidate) {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();

    return () => {};
  }, [categorySlug, currentProductId, language]);

  // On language change: clear cache so related products refetch in the new language
  useEffect(() => {
    const handleLanguageUpdate = () => {
      clearRelatedProductsCache();
      setLanguage(getStoredLanguage());
    };
    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => window.removeEventListener('language-updated', handleLanguageUpdate);
  }, []);

  /**
   * Handle carousel navigation - similar to home page
   */
  const handlePreviousProducts = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCarouselIndex((prevIndex) => {
      // Calculate current page (0-based)
      const currentPage = Math.floor(prevIndex / visibleCount);
      // Move to previous page
      const newPage = currentPage - 1;
      const totalPages = Math.ceil(products.length / visibleCount);
      // If we go below 0, loop to the last page
      if (newPage < 0) {
        const lastPage = Math.max(0, totalPages - 1);
        return lastPage * visibleCount;
      }
      return newPage * visibleCount;
    });
  };

  const handleNextProducts = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCarouselIndex((prevIndex) => {
      // Calculate current page (0-based)
      const currentPage = Math.floor(prevIndex / visibleCount);
      // Move to next page
      const newPage = currentPage + 1;
      const totalPages = Math.ceil(products.length / visibleCount);
      // If we go beyond max, loop to 0
      if (newPage >= totalPages) {
        return 0;
      }
      return newPage * visibleCount;
    });
  };


  /**
   * Handle opening product page
   */
  const handleOpenProduct = (product: FeaturedProduct) => {
    if (product.slug) {
      const encodedSlug = encodeURIComponent(product.slug.trim());
      router.push(`/products/${encodedSlug}`);
    } else {
      router.push(`/products/${product.id}`);
    }
  };

  /**
   * Handle adding product to cart
   */
  const handleAddToCart = async (product: FeaturedProduct) => {
    setAddingToCart(prev => new Set(prev).add(product.id));

    const quantity = product.minimumOrderQuantity || 1;

    const success = await addToCart({
      product,
      variantId: product.defaultVariantId || undefined,
      quantity,
      isLoggedIn,
      router,
      t: tClient,
      onSuccess: () => {
        console.log('✅ [RELATED PRODUCTS] Product added to cart:', product.title);
      },
      onError: (error: any) => {
        console.error('❌ [RELATED PRODUCTS] Error adding to cart:', error);
        if (error?.message) {
          showToast(error.message, 'error');
        } else {
          showToast(tClient('home.errors.failedToAddToCart'), 'error');
        }
      },
    });

    setAddingToCart(prev => {
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });
  };

  // Convert RelatedProduct to FeaturedProduct format
  const convertToFeaturedProduct = (product: RelatedProduct): FeaturedProduct => {
    const raw = product.categories;
    let categories: string[] | undefined;
    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0];
      if (typeof first === 'string') {
        categories = raw.filter((t): t is string => typeof t === 'string' && t.trim() !== '');
      } else {
        categories = (raw as Array<{ title?: string }>)
          .map((cat) => cat?.title?.trim())
          .filter((t): t is string => !!t);
      }
      if (categories.length === 0) categories = undefined;
    }

    let category: string | undefined = undefined;
    if (product.category && product.category.trim() !== '') {
      category = product.category.trim();
    } else if (categories && categories.length > 0) {
      category = categories[0];
    }

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      category,
      categories,
      price: product.price,
      image: product.image,
      inStock: product.inStock,
      minimumOrderQuantity: product.minimumOrderQuantity,
      orderQuantityIncrement: product.orderQuantityIncrement,
      defaultVariantId: product.defaultVariantId || null,
      brand: product.brand || null,
      labels: product.labels,
    };
  };

  // Always show the section, even if no products (will show loading or empty state)
  return (
    <section className="py-12 mt-20 border-t border-gray-200 overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        <h2 className="text-lg sm:text-xl lg:text-3xl font-bold text-gray-900 mb-10 whitespace-nowrap">{t(language, 'product.related_products_title')}</h2>
        
        {loading ? (
          // Loading state
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t(language, 'product.noRelatedProducts')}</p>
          </div>
        ) : (
          // Full-viewport wrapper so arrow positions (50%) are relative to viewport, not max-w-7xl
          <div className="relative w-screen overflow-visible" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
            <div className="max-w-7xl mx-auto">
          {/* Products Carousel - Mobile: same UI as ProductsGrid (grid, no wrapper, same props) */}
          <div className="relative overflow-visible">
            {isMobile ? (
              /* Mobile: 2 cards <768px, 3 cards 768–1024; productCar style */
              <div className={`grid gap-4 sm:gap-6 ${visibleCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {products.slice(carouselIndex, carouselIndex + visibleCount).map((product) => {
                  const featuredProduct = convertToFeaturedProduct(product);
                  const productHref = product.slug ? `/products/${encodeURIComponent(product.slug.trim())}` : null;
                  return (
                    <FeaturedProductCard
                      key={product.id}
                      product={featuredProduct}
                      router={router}
                      t={tClient}
                      isLoggedIn={isLoggedIn}
                      isAddingToCart={addingToCart.has(product.id)}
                      onAddToCart={handleAddToCart}
                      onProductClick={handleOpenProduct}
                      productHref={productHref}
                      formatPrice={(price: number, curr?: any) => formatPrice(price, curr || currency)}
                      currency={currency}
                      isMobile={true}
                      compact={true}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-12 lg:gap-12 md:gap-10 sm:gap-8 justify-center items-start">
                {products.slice(carouselIndex, carouselIndex + 3).map((product) => {
                  const featuredProduct = convertToFeaturedProduct(product);
                  const productHref = product.slug ? `/products/${encodeURIComponent(product.slug.trim())}` : null;
                  return (
                    <div key={product.id} className="w-[280px] min-w-[280px] max-w-[280px] flex-shrink-0">
                      <FeaturedProductCard
                        product={featuredProduct}
                        router={router}
                        t={tClient}
                        isLoggedIn={isLoggedIn}
                        isAddingToCart={addingToCart.has(product.id)}
                        onAddToCart={handleAddToCart}
                        onProductClick={handleOpenProduct}
                        productHref={productHref}
                        formatPrice={(price: number, curr?: any) => formatPrice(price, curr || currency)}
                        currency={currency}
                        isMobile={false}
                        compact={true}
                        isRelated={true}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Navigation Arrows and Pagination - Mobile: arrows next to pagination, Desktop: arrows on sides */}
            {products.length > visibleCount && (
              <>
                {isMobile ? (
                  // Mobile: Arrows next to pagination dots
                  <div className="flex items-center justify-center gap-8 sm:gap-12 md:gap-16 pt-[2px] mt-6">
                    {/* Previous Button - Left side (←) */}
                    <FeaturedProductsNavigationArrow
                      direction="prev"
                      onClick={handlePreviousProducts}
                      className="size-[56px] relative border-[#eee] rotate-180 [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
                      ariaLabel="Previous products"
                    />

                    {/* Pagination Dots */}
                    <div className="flex items-center justify-center gap-2">
                      {(() => {
                        const totalPages = Math.ceil(products.length / visibleCount);
                        return Array.from({ length: totalPages }).map((_, index) => {
                          const pageStartIndex = index * visibleCount;
                          const isActive = carouselIndex === pageStartIndex;
                          
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setCarouselIndex(pageStartIndex)}
                              className={`rounded-full transition-all duration-300 ${
                                isActive
                                  ? 'bg-[#00d1ff] h-[6px] w-[16px]'
                                  : 'bg-[#e2e8f0] size-[6px] hover:bg-[#00d1ff]/50'
                              }`}
                              aria-label={`Go to page ${index + 1}`}
                            />
                          );
                        });
                      })()}
                    </div>

                    {/* Next Button - Right side (→) */}
                    <FeaturedProductsNavigationArrow
                      direction="next"
                      onClick={handleNextProducts}
                      className="size-[56px] relative border-[#eee] rotate-180 [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
                      ariaLabel="Next products"
                    />
                  </div>
                ) : (
                  // Desktop: only pagination below; arrows are rendered outside max-w-7xl (see below)
                  <>
                    {/* Pagination Dots */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                      {(() => {
                        const totalPages = Math.ceil(products.length / visibleCount);
                        return Array.from({ length: totalPages }).map((_, index) => {
                          const pageStartIndex = index * visibleCount;
                          const isActive = carouselIndex === pageStartIndex;
                          
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setCarouselIndex(pageStartIndex)}
                              className={`rounded-full transition-all duration-300 ${
                                isActive
                                  ? 'bg-[#00d1ff] h-[6px] w-[16px]'
                                  : 'bg-[#e2e8f0] size-[6px] hover:bg-[#00d1ff]/50'
                              }`}
                              aria-label={`Go to page ${index + 1}`}
                            />
                          );
                        });
                      })()}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
            </div>
            {/* Desktop arrows: direct children of full-viewport wrapper so 50% = viewport center; more middle space */}
            {!isMobile && products.length > visibleCount && (
              <>
                <FeaturedProductsNavigationArrow
                  direction="prev"
                  onClick={handlePreviousProducts}
                  className="absolute left-[max(8px,calc(50%-560px))] md:left-[max(8px,calc(50%-520px))] lg:left-[max(8px,calc(50%-560px))] top-1/2 -translate-y-1/2 rotate-180 border border-black border-solid shadow-none hover:shadow-none [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
                  ariaLabel="Previous products"
                />
                <FeaturedProductsNavigationArrow
                  direction="next"
                  onClick={handleNextProducts}
                  className="absolute right-[max(8px,calc(50%-560px))] md:right-[max(8px,calc(50%-520px))] lg:right-[max(8px,calc(50%-560px))] top-1/2 -translate-y-1/2 rotate-180 border border-black border-solid shadow-none hover:shadow-none [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
                  ariaLabel="Next products"
                />
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

