'use client';

import { useState, useEffect, useRef, type MouseEvent, type TouchEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { formatPrice, getStoredCurrency } from '../lib/currency';
import { getStoredLanguage, type LanguageCode } from '../lib/language';
import { t } from '../lib/i18n';
import { useAuth } from '../lib/auth/AuthContext';
import { FeaturedProductCard, type FeaturedProduct, addToCart, FeaturedProductsNavigationArrow } from './icons/global/global';
import { useTranslation } from '../lib/i18n-client';

interface RelatedProduct {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null; // Primary category title (when listOnly=true)
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
  categories?: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
  variants?: Array<{
    options?: Array<{
      key: string;
      value: string;
    }>;
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

  // Detect mobile screen size
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
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

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        
        // Get current language (may have changed)
        const currentLang = getStoredLanguage();
        
        // Build params - if no categorySlug, fetch all products
        const params: Record<string, string> = {
          limit: '30', // Fetch more to ensure we have 10 after filtering
          lang: currentLang,
          listOnly: 'true', // Use listOnly mode to get category field (string) instead of categories array
        };
        
        if (categorySlug) {
          params.category = categorySlug;
          console.log('[RelatedProducts] Fetching related products for category:', categorySlug, 'lang:', currentLang);
        } else {
          console.log('[RelatedProducts] No categorySlug, fetching all products, lang:', currentLang);
        }
        
        const response = await apiClient.get<{
          data: RelatedProduct[];
          meta?: {
            total: number;
          };
        } | RelatedProduct[]>('/api/v1/products', {
          params,
        });

        // Handle both response structures: { data: [...], meta: {...} } or direct array
        const productsArray = Array.isArray(response) 
          ? response 
          : (response?.data || []);
        
        console.log('[RelatedProducts] API Response structure:', {
          isArray: Array.isArray(response),
          hasData: !Array.isArray(response) && !!response?.data,
          productsCount: productsArray.length,
        });
        console.log('[RelatedProducts] First product sample:', productsArray[0] ? {
          id: productsArray[0].id,
          title: productsArray[0].title,
          category: productsArray[0].category,
          categories: productsArray[0].categories,
          hasCategory: !!productsArray[0].category,
          hasCategories: !!productsArray[0].categories && productsArray[0].categories.length > 0,
        } : 'No products');
        
        // Filter out current product and take exactly 10
        const filtered = productsArray.filter(p => p.id !== currentProductId);
        console.log('[RelatedProducts] After filtering current product:', filtered.length);
        const finalProducts = filtered.slice(0, 10);
        console.log('[RelatedProducts] Final products to display:', finalProducts.length);
        setProducts(finalProducts);
      } catch (error) {
        console.error('[RelatedProducts] Error fetching related products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
    
    return () => {
      // Cleanup will be handled by the language-updated listener below
    };
  }, [categorySlug, currentProductId, language]);

  // Separate effect for language updates to refetch products
  useEffect(() => {
    const handleLanguageUpdate = () => {
      const newLang = getStoredLanguage();
      console.log('[RelatedProducts] Language updated, refetching products with lang:', newLang);
      setLanguage(newLang);
      // fetchRelatedProducts will be called automatically when language state changes
    };
    
    window.addEventListener('language-updated', handleLanguageUpdate);
    
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [language]);

  /**
   * Handle carousel navigation - similar to home page
   */
  const handlePreviousProducts = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCarouselIndex((prevIndex) => {
      const visibleCount = isMobile ? 2 : 3;
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
      const visibleCount = isMobile ? 2 : 3;
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
          alert(error.message);
        } else {
          alert(tClient('home.errors.failedToAddToCart'));
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
    // Get category - prefer direct category field (from listOnly mode), fallback to categories array
    let category: string | undefined = undefined;
    
    // First try direct category field (when listOnly=true)
    if (product.category && product.category.trim() !== '') {
      category = product.category.trim();
    } 
    // Fallback to categories array if category field is not available
    else if (product.categories && product.categories.length > 0) {
      // Find first category with a valid non-empty title
      const categoryWithTitle = product.categories.find(
        (cat) => cat?.title && cat.title.trim() !== ''
      );
      if (categoryWithTitle) {
        category = categoryWithTitle.title.trim();
      }
    }
    
    console.log('[RelatedProducts] Converting product:', {
      id: product.id,
      title: product.title,
      category: product.category,
      categories: product.categories,
      finalCategory: category,
    });
    
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      category,
      price: product.price,
      image: product.image,
      inStock: product.inStock,
      minimumOrderQuantity: product.minimumOrderQuantity,
      orderQuantityIncrement: product.orderQuantityIncrement,
      defaultVariantId: product.defaultVariantId || null,
      brand: product.brand || null,
    };
  };

  // Always show the section, even if no products (will show loading or empty state)
  return (
    <section className="py-12 mt-20 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">{t(language, 'product.related_products_title')}</h2>
        
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
          // Products Carousel - Similar to home page
          <div className="relative">
            {/* Products Grid - Show products based on carouselIndex */}
            <div className={isMobile ? "grid grid-cols-2 gap-4 justify-center items-start" : "flex gap-12 lg:gap-12 md:gap-10 sm:gap-8 justify-center items-start"}>
              {(() => {
                const visibleCount = isMobile ? 2 : 3;
                const visibleProducts = products.slice(carouselIndex, carouselIndex + visibleCount);
                return visibleProducts.map((product) => {
                  const featuredProduct = convertToFeaturedProduct(product);
                  return (
                    <div key={product.id} className={isMobile ? "w-full" : "max-w-[280px] w-full"}>
                      <FeaturedProductCard
                        product={featuredProduct}
                        router={router}
                        t={tClient}
                        isLoggedIn={isLoggedIn}
                        isAddingToCart={addingToCart.has(product.id)}
                        onAddToCart={handleAddToCart}
                        onProductClick={handleOpenProduct}
                        formatPrice={(price: number, curr?: any) => formatPrice(price, curr || currency)}
                        currency={currency}
                        isMobile={isMobile}
                        compact={true}
                        isRelated={true}
                      />
                    </div>
                  );
                });
              })()}
            </div>

            {/* Navigation Arrows and Pagination - Mobile: arrows next to pagination, Desktop: arrows on sides */}
            {products.length > (isMobile ? 2 : 3) && (
              <>
                {isMobile ? (
                  // Mobile: Arrows next to pagination dots
                  <div className="flex items-center justify-center gap-8 sm:gap-12 md:gap-16 pt-[2px] mt-6">
                    {/* Next Button - Left side */}
                    <FeaturedProductsNavigationArrow
                      direction="next"
                      onClick={handleNextProducts}
                      className="size-[56px] relative border-[#eee] [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
                      ariaLabel="Next products"
                    />

                    {/* Pagination Dots */}
                    <div className="flex items-center justify-center gap-2">
                      {(() => {
                        const visibleCount = 2;
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

                    {/* Previous Button - Right side */}
                    <FeaturedProductsNavigationArrow
                      direction="prev"
                      onClick={handlePreviousProducts}
                      className="size-[56px] relative border-[#eee] [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
                      ariaLabel="Previous products"
                    />
                  </div>
                ) : (
                  // Desktop: Arrows on sides, pagination below
                  <>
                    {/* Next Button - Left side */}
                    <FeaturedProductsNavigationArrow
                      direction="next"
                      onClick={handleNextProducts}
                      className="left-[calc(50%-580px)] lg:left-[calc(50%-580px)] md:left-[calc(50%-530px)] top-1/2 -translate-y-1/2 border border-black border-solid shadow-none hover:shadow-none [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
                      ariaLabel="Next products"
                    />

                    {/* Previous Button - Right side */}
                    <FeaturedProductsNavigationArrow
                      direction="prev"
                      onClick={handlePreviousProducts}
                      className="right-[calc(50%-580px)] lg:right-[calc(50%-580px)] md:right-[calc(50%-530px)] top-1/2 -translate-y-1/2 border border-black border-solid shadow-none hover:shadow-none [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
                      ariaLabel="Previous products"
                    />

                    {/* Pagination Dots */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                      {(() => {
                        const visibleCount = 3;
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
        )}
      </div>
    </section>
  );
}

