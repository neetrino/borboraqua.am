'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FeaturedProductCard, type FeaturedProduct, addToCart } from './icons/global/global';
import { useTranslation } from '../lib/i18n-client';
import { useAuth } from '../lib/auth/AuthContext';
import { formatPrice, getStoredCurrency } from '../lib/currency';

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid-2');
  const [sortedProducts, setSortedProducts] = useState<Product[]>(products);
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  // Initialize with 'AMD' to match server-side default and prevent hydration mismatch
  const [currency, setCurrency] = useState<'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL'>('AMD');

  // Load view mode from URL or localStorage
  useEffect(() => {
    const urlView = searchParams.get('view');
    if (urlView && ['list', 'grid'].includes(urlView)) {
      // Map 'grid' from URL to 'grid-2' for compatibility
      const mappedView: ViewMode = urlView === 'grid' ? 'grid-2' : urlView as ViewMode;
      setViewMode(mappedView);
      localStorage.setItem('products-view-mode', mappedView);
    } else {
      const stored = localStorage.getItem('products-view-mode');
      if (stored && ['list', 'grid-2', 'grid-3'].includes(stored)) {
        setViewMode(stored as ViewMode);
      } else {
        // Default to grid-2 if nothing stored
        setViewMode('grid-2');
        localStorage.setItem('products-view-mode', 'grid-2');
      }
    }
  }, [searchParams]);

  // Initialize currency from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    setCurrency(getStoredCurrency());
  }, []);

  // Listen for view mode changes
  useEffect(() => {
    const handleViewModeChange = (_event: CustomEvent) => {
      setViewMode((_event as CustomEvent).detail);
    };

    window.addEventListener('view-mode-changed', handleViewModeChange as (_event: Event) => void);
    return () => {
      window.removeEventListener('view-mode-changed', handleViewModeChange as (_event: Event) => void);
    };
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

    const success = await addToCart({
      product,
      quantity: 1,
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
    switch (viewMode) {
      case 'list':
        return 'grid grid-cols-1 gap-6';
      case 'grid-2':
        return 'grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2';
      case 'grid-3':
        return 'grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      default:
        return 'grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2';
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
    price: product.price,
    image: product.image,
    inStock: product.inStock,
    brand: product.brand,
  });

  return (
    <div className={getGridClasses()}>
      {sortedProducts.map((product) => {
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
            compact={true}
          />
        );
      })}
    </div>
  );
}

