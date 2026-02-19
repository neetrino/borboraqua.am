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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(4);
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  // Initialize language with 'en' to match server-side default and prevent hydration mismatch
  const [language, setLanguage] = useState<LanguageCode>('en');
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
        };
        
        if (categorySlug) {
          params.category = categorySlug;
          console.log('[RelatedProducts] Fetching related products for category:', categorySlug, 'lang:', currentLang);
        } else {
          console.log('[RelatedProducts] No categorySlug, fetching all products, lang:', currentLang);
        }
        
        const response = await apiClient.get<{
          data: RelatedProduct[];
          meta: {
            total: number;
          };
        }>('/api/v1/products', {
          params,
        });

        console.log('[RelatedProducts] Received products:', response.data.length);
        // Filter out current product and take exactly 10
        const filtered = response.data.filter(p => p.id !== currentProductId);
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

  // Determine visible cards based on screen size
  useEffect(() => {
    const updateVisibleCards = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleCards(1); // mobile
      } else if (width < 1024) {
        setVisibleCards(2); // tablet
      } else if (width < 1280) {
        setVisibleCards(3); // desktop
      } else {
        setVisibleCards(4); // large desktop
      }
    };

    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (products.length <= visibleCards || isDragging) return; // Don't auto-rotate if all products are visible or if dragging
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = Math.max(0, products.length - visibleCards);
        return prevIndex >= maxIndex ? 0 : prevIndex + 1;
      });
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [products.length, visibleCards, isDragging]);

  // Adjust currentIndex when visibleCards changes
  useEffect(() => {
    const maxIndex = Math.max(0, products.length - visibleCards);
    setCurrentIndex((prevIndex) => {
      if (prevIndex > maxIndex) {
        return maxIndex;
      }
      return prevIndex;
    });
  }, [visibleCards, products.length]);

  // Update currentIndex based on scroll position for mobile
  useEffect(() => {
    if (visibleCards > 1 || !carouselRef.current) return; // Only for mobile with native scroll
    
    const handleScroll = () => {
      if (!carouselRef.current) return;
      const scrollLeft = carouselRef.current.scrollLeft;
      const clientWidth = carouselRef.current.clientWidth;
      
      // Calculate which card is currently visible
      // Card width is min(85vw, 320px) + padding (24px total: 12px on each side)
      const cardWidth = Math.min(clientWidth * 0.85, 320) + 24;
      const currentCardIndex = Math.round(scrollLeft / cardWidth);
      const clampedIndex = Math.max(0, Math.min(products.length - 1, currentCardIndex));
      
      setCurrentIndex((prevIndex) => {
        if (prevIndex !== clampedIndex) {
          return clampedIndex;
        }
        return prevIndex;
      });
    };

    const carousel = carouselRef.current;
    carousel.addEventListener('scroll', handleScroll);
    
    return () => {
      carousel.removeEventListener('scroll', handleScroll);
    };
  }, [visibleCards, products.length]);

  const maxIndex = Math.max(0, products.length - visibleCards);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => {
      return prevIndex === 0 ? maxIndex : prevIndex - 1;
    });
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => {
      return prevIndex >= maxIndex ? 0 : prevIndex + 1;
    });
  };

  /**
   * Handle mouse down for dragging
   */
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;
    setHasMoved(false);
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(currentIndex);
  };

  /**
   * Handle mouse move for dragging
   */
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.pageX - carouselRef.current.offsetLeft;
    const deltaX = Math.abs(x - startX);
    
    // Only consider it dragging if mouse moved more than 5px
    if (deltaX > 5) {
      setHasMoved(true);
      e.preventDefault();
      const walk = (x - startX) * 2; // Scroll speed multiplier
      const cardWidth = 100 / visibleCards;
      const newIndex = Math.round((scrollLeft - walk / (carouselRef.current.offsetWidth / 100)) / cardWidth);
      const clampedIndex = Math.max(0, Math.min(maxIndex, newIndex));
      setCurrentIndex(clampedIndex);
    }
  };

  /**
   * Handle mouse up/leave to stop dragging
   */
  const handleMouseUp = () => {
    const wasDragging = isDragging;
    const didMove = hasMoved;
    setIsDragging(false);
    // Reset hasMoved after a short delay to allow click events to process
    // Only reset if we were actually dragging
    if (wasDragging && didMove) {
      setTimeout(() => setHasMoved(false), 150);
    } else {
      setHasMoved(false);
    }
  };

  /**
   * Handle touch start for mobile dragging
   */
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;
    setHasMoved(false);
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(currentIndex);
  };

  /**
   * Handle touch move for mobile dragging
   */
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const deltaX = Math.abs(x - startX);
    
    // Only consider it dragging if touch moved more than 5px
    if (deltaX > 5) {
      setHasMoved(true);
      const walk = (x - startX) * 2;
      const cardWidth = 100 / visibleCards;
      const newIndex = Math.round((scrollLeft - walk / (carouselRef.current.offsetWidth / 100)) / cardWidth);
      const clampedIndex = Math.max(0, Math.min(maxIndex, newIndex));
      setCurrentIndex(clampedIndex);
    }
  };

  /**
   * Handle touch end to stop dragging
   */
  const handleTouchEnd = () => {
    const wasDragging = isDragging;
    const didMove = hasMoved;
    setIsDragging(false);
    // Reset hasMoved after a short delay to allow click events to process
    // Only reset if we were actually dragging
    if (wasDragging && didMove) {
      setTimeout(() => setHasMoved(false), 150);
    } else {
      setHasMoved(false);
    }
  };

  /**
   * Handle wheel scroll for horizontal scrolling
   */
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY === 0) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex + delta;
      return Math.max(0, Math.min(maxIndex, newIndex));
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
  const convertToFeaturedProduct = (product: RelatedProduct): FeaturedProduct => ({
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description || undefined,
    price: product.price,
    image: product.image,
    inStock: product.inStock,
    minimumOrderQuantity: product.minimumOrderQuantity,
    orderQuantityIncrement: product.orderQuantityIncrement,
    defaultVariantId: product.defaultVariantId || null,
    brand: product.brand || null,
  });

  // Always show the section, even if no products (will show loading or empty state)
  return (
    <section className="py-12 mt-20 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">{t(language, 'product.related_products_title')}</h2>
        
        {loading ? (
          // Loading state
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          // Products Carousel
          <div className="relative related-products-carousel">
            {/* Carousel Container */}
            <div 
              ref={carouselRef}
              className={`relative related-products-carousel-container ${visibleCards === 1 ? 'overflow-x-auto' : 'sm:overflow-hidden'} cursor-grab active:cursor-grabbing select-none scrollbar-hide`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: visibleCards === 1 ? 'x mandatory' : 'none',
              }}
            >
              <div
                className="flex items-stretch sm:flex-row"
                style={{
                  transform: visibleCards > 1 ? `translateX(-${currentIndex * (100 / visibleCards)}%)` : 'none',
                  transition: visibleCards > 1 && !isDragging ? 'transform 0.5s ease-in-out' : 'none',
                }}
              >
                {products.map((product) => {
                  const featuredProduct = convertToFeaturedProduct(product);
                  return (
                    <div
                      key={product.id}
                      className="flex-shrink-0 px-3 h-full snap-start"
                      style={{ 
                        width: visibleCards === 1 ? 'min(85vw, 320px)' : `${100 / visibleCards}%`,
                      }}
                      onClick={(e) => {
                        // Prevent navigation if we actually dragged
                        if (hasMoved) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                      }}
                    >
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
                        compact={true}
                        isRelated={true}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Arrows - Only show on desktop (hidden on mobile) */}
            {products.length > visibleCards && (
              <>
                <FeaturedProductsNavigationArrow
                  direction="next"
                  onClick={(e?: React.MouseEvent) => {
                    if (e) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    goToNext();
                  }}
                  className="hidden min-[1025px]:block absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-8 sm:translate-x-12 md:translate-x-16 lg:translate-x-20 rotate-180 z-20 size-[32px] sm:size-[36px] md:size-[42px] lg:size-[48px] !border-black hover:!border-black !p-0 flex items-center justify-center [&_path]:fill-black [&_path]:hover:fill-black [&_svg]:m-auto"
                  ariaLabel="Next products"
                />

                <FeaturedProductsNavigationArrow
                  direction="prev"
                  onClick={(e?: React.MouseEvent) => {
                    if (e) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    goToPrevious();
                  }}
                  className="hidden min-[1025px]:block absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8 sm:-translate-x-12 md:-translate-x-16 lg:-translate-x-20 rotate-180 z-20 size-[32px] sm:size-[36px] md:size-[42px] lg:size-[48px] !border-black hover:!border-black !p-0 flex items-center justify-center [&_path]:fill-black [&_path]:hover:fill-black [&_svg]:m-auto"
                  ariaLabel="Previous products"
                />
              </>
            )}

            {/* Dots Indicator - Only show if there are more products than visible */}
            {products.length > visibleCards && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ 
                  length: visibleCards === 1 ? products.length : Math.ceil(products.length / visibleCards) 
                }).map((_, index) => {
                  // For mobile (visibleCards === 1), each dot represents one product
                  // For desktop, each dot represents a page of visibleCards products
                  const startIndex = visibleCards === 1 ? index : index * visibleCards;
                  const endIndex = visibleCards === 1 ? index + 1 : Math.min(startIndex + visibleCards, products.length);
                  
                  // For mobile, check exact match; for desktop, check if currentIndex is within page range
                  const isActive = visibleCards === 1 
                    ? currentIndex === index
                    : currentIndex >= startIndex && currentIndex < endIndex;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (visibleCards === 1 && carouselRef.current) {
                          // For mobile, scroll to the card
                          const cardWidth = Math.min(carouselRef.current.clientWidth * 0.85, 320);
                          carouselRef.current.scrollTo({
                            left: index * (cardWidth + 24), // cardWidth + padding
                            behavior: 'smooth'
                          });
                        }
                        setCurrentIndex(startIndex);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-[#00d1ff] w-8'
                          : 'bg-gray-300 hover:bg-[#00d1ff]/50 w-2'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

