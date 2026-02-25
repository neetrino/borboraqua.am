'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FeaturedProductCard, type FeaturedProduct, addToCart } from './icons/global/global';
import { useTranslation } from '../lib/i18n-client';
import { useAuth } from '../lib/auth/AuthContext';
import { formatPrice, getStoredCurrency, initializeCurrencyRates } from '../lib/currency';

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
}

type ViewMode = 'list' | 'grid-2' | 'grid-3';

interface ProductsGridProps {
  products: Product[];
  sortBy?: string;
}

export function ProductsGrid({ products, sortBy = 'default' }: ProductsGridProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('grid-3');
  const [sortedProducts, setSortedProducts] = useState<Product[]>(products);
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  // Initialize with 'AMD' to match server-side default and prevent hydration mismatch
  const [currency, setCurrency] = useState<'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL'>('AMD');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Always use grid-3 view mode
  useEffect(() => {
    setViewMode('grid-3');
    localStorage.setItem('products-view-mode', 'grid-3');
  }, []);

  // Initialize currency from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    setCurrency(getStoredCurrency());
    // Initialize currency rates from API
    initializeCurrencyRates().catch(console.error);
    
    // Listen for currency rates updates
    const handleCurrencyRatesUpdate = () => {
      console.log('💱 [PRODUCTS GRID] Currency rates updated, reloading rates...');
      initializeCurrencyRates(true).catch(console.error);
    };
    
    window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    
    return () => {
      window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    };
  }, []);

  // Detect mobile screen size using matchMedia for accurate responsive detection even with zoom
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)'); // md breakpoint (768px) - tablet is not mobile
    const checkMobile = () => {
      setIsMobile(mediaQuery.matches);
    };
    
    checkMobile();
    // Use addEventListener for matchMedia (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkMobile);
      return () => mediaQuery.removeEventListener('change', checkMobile);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(checkMobile);
      window.addEventListener('resize', checkMobile);
      return () => {
        mediaQuery.removeListener(checkMobile);
        window.removeEventListener('resize', checkMobile);
      };
    }
  }, []);

  // Detect tablet screen size (768px - 1279px) for shop page - use mobile card on tablet
  // This covers md (768px) and lg (1024px) breakpoints, but not xl (1280px+)
  useEffect(() => {
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1279px)');
    const checkTablet = () => {
      setIsTablet(tabletQuery.matches);
    };
    
    checkTablet();
    // Use addEventListener for matchMedia (modern browsers)
    if (tabletQuery.addEventListener) {
      tabletQuery.addEventListener('change', checkTablet);
      return () => tabletQuery.removeEventListener('change', checkTablet);
    } else {
      // Fallback for older browsers
      tabletQuery.addListener(checkTablet);
      window.addEventListener('resize', checkTablet);
      return () => {
        tabletQuery.removeListener(checkTablet);
        window.removeEventListener('resize', checkTablet);
      };
    }
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

  // Handle opening product page
  const handleOpenProduct = (product: FeaturedProduct) => {
    if (product.slug) {
      const encodedSlug = encodeURIComponent(product.slug.trim());
      router.push(`/products/${encodedSlug}`);
    } else {
      router.push(`/products/${product.id}`);
    }
  };

  // Handle adding product to cart
  const handleAddToCart = async (product: FeaturedProduct) => {
    setAddingToCart(prev => new Set(prev).add(product.id));

    const quantity = product.minimumOrderQuantity || 1;

    const success = await addToCart({
      product,
      variantId: product.defaultVariantId || undefined,
      quantity,
      isLoggedIn,
      router,
      t,
      onSuccess: () => {
        console.log('✅ [PRODUCTS GRID] Product added to cart:', product.title);
      },
      onError: (error: any) => {
        console.error('❌ [PRODUCTS GRID] Error adding to cart:', error);
        if (error?.message) {
          alert(error.message);
        } else {
          alert(t('home.errors.failedToAddToCart'));
        }
      },
    });

    setAddingToCart(prev => {
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });
  };

  // Sort products
  useEffect(() => {
    let sorted = [...products];

    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        // Keep original order
        break;
    }

    setSortedProducts(sorted);
  }, [products, sortBy]);

  // Get grid classes based on view mode
  const getGridClasses = () => {
    // Always use responsive classes - let Tailwind handle breakpoints
    // Mobile (< 768px): 2 columns
    // Tablet (md, >= 768px): 3 columns
    // Desktop (lg, >= 1024px): 3 columns
    switch (viewMode) {
      case 'list':
        return 'grid grid-cols-1 gap-12';
      case 'grid-2':
        return 'grid grid-cols-2 gap-12 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2';
      case 'grid-3':
        // Mobile: 2 columns, Tablet (md) and Desktop (lg): 3 columns
        return 'grid grid-cols-2 gap-4 sm:gap-6 md:gap-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3';
      default:
        // Mobile: 2 columns, Tablet (md) and Desktop (lg): 3 columns
        return 'grid grid-cols-2 gap-4 sm:gap-6 md:gap-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3';
    }
  };

  if (sortedProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('products.grid.noProducts')}</p>
      </div>
    );
  }

  // Convert Product to FeaturedProduct format
  const convertToFeaturedProduct = (product: Product): FeaturedProduct => ({
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description ?? undefined,
    category: product.category ?? undefined,
    minimumOrderQuantity: product.minimumOrderQuantity,
    orderQuantityIncrement: product.orderQuantityIncrement,
    price: product.price,
    image: product.image,
    inStock: product.inStock,
    brand: product.brand,
  });

  // Limit products: 9 on desktop, 8 on mobile
  const displayProducts = isMobile ? sortedProducts.slice(0, 8) : sortedProducts.slice(0, 9);

  return (
    <div className={getGridClasses()}>
      {displayProducts.map((product) => {
        const featuredProduct = convertToFeaturedProduct(product);
        return (
          <FeaturedProductCard
            key={product.id}
            product={featuredProduct}
            router={router}
            t={t}
            isLoggedIn={isLoggedIn}
            isAddingToCart={addingToCart.has(product.id)}
            onAddToCart={handleAddToCart}
            onProductClick={handleOpenProduct}
            formatPrice={(price: number, curr?: any) => formatPrice(price, curr || currency)}
            currency={currency}
            isMobile={isMobile || isTablet}
            compact={true}
          />
        );
      })}
    </div>
  );
}

