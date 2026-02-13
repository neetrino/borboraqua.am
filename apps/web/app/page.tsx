'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { formatPrice, getStoredCurrency, setStoredCurrency, type CurrencyCode } from '../lib/currency';
import { getStoredLanguage, setStoredLanguage, LANGUAGES, type LanguageCode } from '../lib/language';
import { useAuth } from '../lib/auth/AuthContext';
import { useTranslation } from '../lib/i18n-client';
import { CartIcon } from '../components/icons/CartIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { HeaderCartIcon } from '../components/icons/HeaderCartIcon';
import { LanguageIcon } from '../components/icons/LanguageIcon';
import { ExitIcon } from '../components/icons/ExitIcon';
import { Header, Footer, Button, addToCart, FeaturedProductCard, type FeaturedProduct, FeaturedProductsNavigationArrow } from '../components/icons/global/global';
import { DraggableBulb } from '../components/DraggableBulb';

// Local image paths - Images stored in public/assets/home/
const imgBorborAguaLogoColorB2024Colored1 = "/assets/home/imgBorborAguaLogoColorB2024Colored1.png";
// Wave background PNG from Figma, saved locally in public/assets/home
const imgDanielSinocaAancLsb0SU0Unsplash1 = "/assets/home/imgDanielWave.png";
const img1 = "/assets/home/img1.png";
const img6Eb12990A37F43358E368Af827A9C8A5Png1 = "/assets/home/img6Eb12990A37F43358E368Af827A9C8A5Png1.png";
const imgLogo1 = "/assets/home/imgLogo1.png";
const imgSas20Logo1 = "/assets/home/imgSas20Logo1.png";
const img5 = "/assets/home/img5.png";
const img6 = "/assets/home/img6.png";
const img17 = "/assets/home/img17.png";
const imgEllipse41 = "/assets/home/imgEllipse41.svg";
const imgShape = "/assets/home/imgShape.svg";
const imgEllipse44 = "/assets/home/imgEllipse44.svg";
const imgShape1 = "/assets/home/imgShape1.svg";
const imgShape2 = "/assets/home/imgShape2.svg";
const imgEllipse42 = "/assets/home/imgEllipse42.svg";
const imgEllipse43 = "/assets/home/imgEllipse43.svg";
const imgGroup2105 = "/assets/home/21056.png";
const img4 = "/assets/home/img4.svg";
const imgVector4 = "/assets/home/imgVector4.svg";
const imgVector5 = "/assets/home/imgVector5.svg";
const imgVector6 = "/assets/home/imgVector6.svg";
const imgVector7 = "/assets/home/imgVector7.svg";
const imgVector = "/assets/home/imgVector.svg";
const imgVector1 = "/assets/home/imgVector1.svg";
const imgIcon2 = "/assets/home/imgIcon2.svg";
const imgSvg = "/assets/home/imgSvg.svg";
const imgSvg1 = "/assets/home/imgSvg1.svg";
const imgGroup = "/assets/home/imgGroup.svg";
const imgLink = "/assets/home/imgLink.svg";
const imgGroup2122 = "/assets/home/imgGroup2122.svg";
const imgGroup2121 = "/assets/home/imgGroup2121.svg";
const imgGroup2124 = "/assets/home/imgGroup2124.svg";
const imgGroup2123 = "/assets/home/imgGroup2123.svg";
const img7 = "/assets/home/img7.svg";
const img8 = "/assets/home/img8.svg";
const img9 = "/assets/home/img9.svg";
const img10 = "/assets/home/img10.svg";
const img11 = "/assets/home/img11.svg";
const img12 = "/assets/home/img12.svg";
const img13 = "/assets/home/img13.svg";
const img13Decorative = "/assets/home/img13Decorative.png";
const img14 = "/assets/home/img14.svg";

// Shared configuration for "Trusted By" logos (used on both desktop and mobile)
const TRUSTED_BY_LOGOS = [
  { src: imgSas20Logo1, alt: 'Partner Logo 1' },
  { src: img6Eb12990A37F43358E368Af827A9C8A5Png1, alt: 'Partner Logo 2' },
  { src: imgLogo1, alt: 'Partner Logo 3' },
];
const img15 = "/assets/home/img15.svg";
const img16 = "/assets/home/img16.svg";
const img18 = "/assets/home/img18.svg";
const imgBulb = "/assets/home/bulb.svg";
// Mobile-specific images from Figma
const imgBorborAquaProductKids033L2 = "/assets/home/imgBorborAquaProductKids033L2.png";
const imgSqawdef1 = "/assets/home/imgSqawdef1.png";
const imgScreenshot20260114At0835551 = "/assets/home/imgScreenshot20260114At0835551.png";
const imgScreenshot20260112At1535403 = "/assets/home/imgScreenshot20260112At1535403.png";
const imgEllipse2 = "/assets/home/imgEllipse2.svg";
const imgVector2 = "/assets/home/imgVector2.svg";
const imgVector3 = "/assets/home/imgVector3.svg";
const imgGroup2148 = "/assets/home/imgGroup2148.svg";
const imgGroup2149 = "/assets/home/imgGroup2149.svg";
const imgVector8 = "/assets/home/imgVector8.svg";
const imgGlass3 = "/assets/home/imgGlass3.svg";
const imgGlass4 = "/assets/home/imgGlass4.svg";
const imgBg = "/assets/home/imgBg.svg";
const imgGlass = "/assets/home/imgGlass.svg";
const imgTop = "/assets/home/imgTop.svg";
const imgTop1 = "/assets/home/imgTop1.svg";
const imgGlass1 = "/assets/home/imgGlass1.svg";
const imgGlass2 = "/assets/home/imgGlass2.svg";
const imgIcon = "/assets/home/imgIcon.svg";
const imgDanielSinocaAancLsb0SU0Unsplash3 = "/assets/home/imgDanielWave.png";
const imgEllipse45 = "/assets/home/imgEllipse45.svg";
const imgHomeVector = "/assets/home/Vector.svg";

// Product interface for featured products
interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  price: number;
  image: string | null;
  inStock: boolean;
  minimumOrderQuantity?: number;
  orderQuantityIncrement?: number;
  brand: {
    id: string;
    name: string;
  } | null;
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

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn, logout, isAdmin } = useAuth();
  const { t, lang } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  // State for featured products
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  // State for Trusted By section pagination
  const [trustedByIndex, setTrustedByIndex] = useState(0);

  // State for water energy products (kids products)
  const [waterEnergyProducts, setWaterEnergyProducts] = useState<Product[]>([]);
  const [waterEnergyLoading, setWaterEnergyLoading] = useState(true);
  const [waterEnergyCarouselIndex, setWaterEnergyCarouselIndex] = useState(0);

  // Removed scaling logic - using Tailwind responsive classes instead
  // This prevents zoom issues and conflicts with responsive design

  // Carousel index tracking (removed debug logs for production)

  // State for header navigation
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // State for language and currency
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [currency, setCurrency] = useState<CurrencyCode>('AMD');
  const [showLangCurrencyMenu, setShowLangCurrencyMenu] = useState(false);
  const langCurrencyMenuRef = useRef<HTMLDivElement | null>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // State to track if device is desktop (based on screen width, not viewport - zoom-independent)
  const [isDesktopScreen, setIsDesktopScreen] = useState(false);

  // Check if screen is desktop size (zoom-independent check)
  useEffect(() => {
    const checkDesktopScreen = () => {
      // Use screen.width instead of window.innerWidth to be zoom-independent
      // Desktop screens are typically 1280px or wider
      setIsDesktopScreen(typeof window !== 'undefined' && window.screen.width >= 1280);
    };
    
    checkDesktopScreen();
    // Listen to orientation changes and window resize (but use screen.width which doesn't change with zoom)
    window.addEventListener('resize', checkDesktopScreen);
    window.addEventListener('orientationchange', checkDesktopScreen);
    return () => {
      window.removeEventListener('resize', checkDesktopScreen);
      window.removeEventListener('orientationchange', checkDesktopScreen);
    };
  }, []);

  // Fetch featured products from backend
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setProductsLoading(true);
        console.log('📦 [HOMEPAGE] Fetching featured products...');

        const language = getStoredLanguage();
        const params: Record<string, string> = {
          page: '1',
          limit: '9', // Get 9 products for carousel
          lang: language,
          filter: 'featured', // Try to get featured products
        };

        const response = await apiClient.get<ProductsResponse>('/api/v1/products', {
          params,
        });

        console.log(`✅ [HOMEPAGE] Loaded ${response.data.length} featured products`);

        // If we got less than 9 products, try without filter to get any products
        if (response.data.length < 9) {
          console.log('⚠️ [HOMEPAGE] Less than 9 featured products, fetching any products...');
          const fallbackParams: Record<string, string> = {
            page: '1',
            limit: '9',
            lang: language,
          };
          const fallbackResponse = await apiClient.get<ProductsResponse>('/api/v1/products', {
            params: fallbackParams,
          });
          setFeaturedProducts(fallbackResponse.data.slice(0, 9));
        } else {
          setFeaturedProducts(response.data.slice(0, 9));
        }
      } catch (err: any) {
        console.error('❌ [HOMEPAGE] Error fetching featured products:', err);
        setFeaturedProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Fetch water energy products (kids products)
  useEffect(() => {
    const fetchWaterEnergyProducts = async () => {
      try {
        setWaterEnergyLoading(true);
        console.log('💧 [HOMEPAGE] Fetching water energy (kids) products...');

        const language = getStoredLanguage();
        
        // Strategy 1: Try to search for "kids" products first
        let params: Record<string, string> = {
          page: '1',
          limit: '10',
          lang: language,
          search: 'kids',
        };

        let response = await apiClient.get<ProductsResponse>('/api/v1/products', {
          params,
        });

        console.log('💧 [HOMEPAGE] Kids search response:', {
          hasData: !!response.data,
          dataLength: response.data?.length || 0,
          dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
          fullResponse: response
        });

        // Check if response.data exists and is an array
        if (!response.data || !Array.isArray(response.data)) {
          console.warn('⚠️ [HOMEPAGE] Invalid response structure:', response);
          response = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } as ProductsResponse;
        }

        console.log(`💧 [HOMEPAGE] Kids search result: ${response.data.length} products`);

        // Strategy 2: If no kids products found, try featured products
        if (response.data.length === 0) {
          console.log('⚠️ [HOMEPAGE] No kids products found, trying featured products...');
          params = {
            page: '1',
            limit: '10',
            lang: language,
            filter: 'featured',
          };
          response = await apiClient.get<ProductsResponse>('/api/v1/products', {
            params,
          });
          
          // Validate response structure
          if (!response.data || !Array.isArray(response.data)) {
            console.warn('⚠️ [HOMEPAGE] Invalid featured response structure:', response);
            response = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } as ProductsResponse;
          }
          
          console.log(`💧 [HOMEPAGE] Featured products result: ${response.data.length} products`);
        }

        // Strategy 3: If still no products, get any products
        if (response.data.length === 0) {
          console.log('⚠️ [HOMEPAGE] No featured products found, fetching any products...');
          params = {
            page: '1',
            limit: '10',
            lang: language,
          };
          response = await apiClient.get<ProductsResponse>('/api/v1/products', {
            params,
          });
          
          // Validate response structure
          if (!response.data || !Array.isArray(response.data)) {
            console.warn('⚠️ [HOMEPAGE] Invalid any products response structure:', response);
            response = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } as ProductsResponse;
          }
          
          console.log(`💧 [HOMEPAGE] Any products result: ${response.data.length} products`);
        }

        if (response.data && response.data.length > 0) {
          const products = response.data.slice(0, 10);
          setWaterEnergyProducts(products);
          console.log(`✅ [HOMEPAGE] Loaded ${products.length} water energy products:`, products.map(p => p.title));
        } else {
          console.warn('⚠️ [HOMEPAGE] No products available for water energy section, will use featured products if available');
          // Don't set empty array yet, wait for featured products to load
          // This will be handled by a separate useEffect that watches featuredProducts
        }
      } catch (err: any) {
        console.error('❌ [HOMEPAGE] Error fetching water energy products:', err);
        // Try to get any products as last resort
        try {
          const language = getStoredLanguage();
          const fallbackResponse = await apiClient.get<ProductsResponse>('/api/v1/products', {
            params: {
              page: '1',
              limit: '10',
              lang: language,
            },
          });
          if (fallbackResponse.data && fallbackResponse.data.length > 0) {
            setWaterEnergyProducts(fallbackResponse.data.slice(0, 10));
            console.log('✅ [HOMEPAGE] Fallback: Loaded products after error');
          } else {
            setWaterEnergyProducts([]);
          }
        } catch (fallbackErr) {
          console.error('❌ [HOMEPAGE] Fallback also failed:', fallbackErr);
          setWaterEnergyProducts([]);
        }
      } finally {
        setWaterEnergyLoading(false);
      }
    };

    fetchWaterEnergyProducts();
  }, []);

  // Fallback: Use featured products if water energy products are not available
  useEffect(() => {
    if (!waterEnergyLoading && waterEnergyProducts.length === 0 && featuredProducts.length > 0) {
      console.log('💧 [HOMEPAGE] Using featured products as fallback for water energy section');
      setWaterEnergyProducts(featuredProducts.slice(0, 10));
    }
  }, [waterEnergyLoading, waterEnergyProducts.length, featuredProducts]);

  // Handle click outside for search modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchModalRef.current && !searchModalRef.current.contains(event.target as Node)) {
        setShowSearchModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (showSearchModal && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchModal]);

  // Close search modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSearchModal) {
        setShowSearchModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSearchModal]);

  // Close language menu and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      // Mobile menu closes when clicking on overlay (handled in JSX)
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Handle language change
   */
  // Initialize language and currency from storage
  useEffect(() => {
    setLanguage(getStoredLanguage());
    setCurrency(getStoredCurrency());

    // Listen for updates
    const handleLanguageUpdate = () => {
      setLanguage(getStoredLanguage());
    };
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('language-updated', handleLanguageUpdate);
    window.addEventListener('currency-updated', handleCurrencyUpdate);

    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
    };
  }, []);

  // Close lang/currency menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langCurrencyMenuRef.current && !langCurrencyMenuRef.current.contains(event.target as Node)) {
        setShowLangCurrencyMenu(false);
      }
    };

    if (showLangCurrencyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangCurrencyMenu]);

  // Get language code for display (EN, HY, RU)
  const getLanguageDisplayCode = (code: LanguageCode): string => {
    const codes: Record<LanguageCode, string> = {
      en: 'EN',
      hy: 'HY',
      ru: 'RU',
    };
    return codes[code] || 'EN';
  };

  const handleLanguageChange = (langCode: LanguageCode) => {
    if (langCode === language) {
      setShowLangCurrencyMenu(false);
      return;
    }
    setLanguage(langCode);
    setStoredLanguage(langCode, { skipReload: false }); // Reload page on home page
    setShowLangCurrencyMenu(false);
  };

  const handleCurrencyChange = (code: CurrencyCode) => {
    if (code === currency) {
      setShowLangCurrencyMenu(false);
      return;
    }
    setCurrency(code);
    setStoredCurrency(code);
    setShowLangCurrencyMenu(false);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  /**
   * Handle search
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const params = new URLSearchParams();

    if (query) {
      params.set('search', query);
    }

    setShowSearchModal(false);
    const queryString = params.toString();
    router.push(queryString ? `/products?${queryString}` : '/products');
  };

  /**
   * Handle carousel navigation - 3 modes: 0 (products 0-2), 3 (products 3-5), 6 (products 6-8)
   */
  const handlePreviousProducts = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCarouselIndex((prevIndex) => {
      // Move to previous mode (2 products back for mobile, 3 for desktop)
      // Use matchMedia for accurate responsive detection even with zoom
      const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches;
      const step = isMobile ? 2 : 3;
      const newIndex = prevIndex - step;
      // If we go below 0, loop to the last valid index
      if (newIndex < 0) {
        const maxIndex = isMobile 
          ? Math.max(0, Math.floor((featuredProducts.length - 2) / 2) * 2) 
          : Math.max(0, Math.floor((featuredProducts.length - 3) / 3) * 3);
        return maxIndex;
      }
      return newIndex;
    });
  };

  /**
   * Handle Trusted By section navigation
   */
  const handlePreviousTrustedBy = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setTrustedByIndex((prevIndex) => {
      // Move to previous logo (0 -> 2, 1 -> 0, 2 -> 1)
      return prevIndex === 0 ? 2 : prevIndex - 1;
    });
  };

  const handleNextTrustedBy = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setTrustedByIndex((prevIndex) => {
      // Move to next logo (0 -> 1, 1 -> 2, 2 -> 0)
      return prevIndex === 2 ? 0 : prevIndex + 1;
    });
  };

  const handleNextProducts = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCarouselIndex((prevIndex) => {
      // Move to next mode (2 products forward for mobile, 3 for desktop)
      // Use matchMedia for accurate responsive detection even with zoom
      const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches;
      const step = isMobile ? 2 : 3;
      const newIndex = prevIndex + step;
      // If we exceed the max, loop back to start (0)
      const maxIndex = isMobile 
        ? Math.max(0, Math.floor((featuredProducts.length - 2) / 2) * 2) 
        : Math.max(0, Math.floor((featuredProducts.length - 3) / 3) * 3);
      if (newIndex > maxIndex) {
        return 0; // First mode
      }
      return newIndex;
    });
  };

  /**
   * Open single product page by slug (or id fallback)
   */
  const handleOpenProduct = (product: Product) => {
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
  const handleAddToCart = async (product: Product) => {
    setAddingToCart(prev => new Set(prev).add(product.id));

    const quantity = product.minimumOrderQuantity || 1;

    const success = await addToCart({
      product,
      quantity,
      isLoggedIn,
      router,
      t,
      onSuccess: () => {
        console.log('✅ [HOMEPAGE] Product added to cart:', product.title);
      },
      onError: (error: any) => {
        console.error('❌ [HOMEPAGE] Error adding to cart:', error);
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

  return (
    <div className="w-full bg-white overflow-x-hidden">
      {/* Mobile / Tablet Version - Visible up to xl, but hidden on desktop screens (zoom-independent) */}
      <div className={`${isDesktopScreen ? 'hidden' : 'xl:hidden'} bg-white relative w-full max-w-[430px] sm:max-w-none mx-auto min-h-screen overflow-x-hidden max-w-full`}>
        {/* Mobile Header (hidden when menu/search popups are open) */}
        {!showMobileMenu && !showSearchModal && (
        <div className="absolute content-stretch flex items-center justify-between left-4 right-4 top-[35px] z-50 max-w-full">
          <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
            {/* Mobile Menu Button (Hamburger) */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="bg-[rgba(0,0,0,0)] border-[0.5px] border-[rgba(255,255,255,0.49)] border-solid content-stretch cursor-pointer flex flex-col items-start px-[15.5px] py-[18.5px] relative rounded-[9999px] w-[49px] transition-all duration-300 hover:bg-white/10 hover:border-white/80 hover:scale-110 active:scale-95"
            >
              <div className="flex items-center justify-center relative shrink-0">
                <div className="-scale-y-100 flex-none rotate-180">
                  <div className="h-[12px] relative w-[18px]">
                    <img className="block max-w-none size-full" alt="" src={imgVector3} />
                  </div>
                </div>
              </div>
            </button>
            {/* Mobile Search Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="bg-[rgba(0,0,0,0)] border-[0.5px] border-[rgba(255,255,255,0.49)] border-solid content-stretch cursor-pointer flex items-center p-[14.5px] relative rounded-[9999px] transition-all duration-300 hover:bg-white/10 hover:border-white/80 hover:scale-110 active:scale-95"
            >
              <div className="flex items-center justify-center relative shrink-0">
                <div className="-scale-y-100 flex-none rotate-180">
                  <div className="relative size-[20px]">
                    <img className="block max-w-none size-full" alt="" src={imgVector2} />
                  </div>
                </div>
              </div>
            </button>
          </div>
          
          {/* Language & Currency Selector */}
          <div className="relative" ref={langCurrencyMenuRef}>
            <button
              onClick={() => setShowLangCurrencyMenu(!showLangCurrencyMenu)}
              className="bg-[#1ac0fd] rounded-[70px] flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:bg-[#6bb8dc] active:scale-95"
              aria-expanded={showLangCurrencyMenu}
            >
              {/* Globe Icon */}
              <img 
                src="/assets/home/Vector.svg" 
                alt="Language" 
                className="w-4 h-4 block"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              {/* Language / Currency Text */}
              <span className="text-white text-sm font-medium whitespace-nowrap">
                {getLanguageDisplayCode(language)} / {currency}
              </span>
              {/* Dropdown Arrow */}
              <svg 
                className={`w-3 h-3 text-white transition-transform duration-200 ${showLangCurrencyMenu ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showLangCurrencyMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Language Section */}
                <div className="px-3 py-2 border-b border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Language</div>
                  {Object.entries(LANGUAGES).map(([code, lang]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code as LanguageCode)}
                      className={`w-full text-left px-3 py-2 text-sm rounded transition-all duration-150 ${
                        language === code
                          ? 'bg-gray-100 text-gray-900 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
                {/* Currency Section */}
                <div className="px-3 py-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Currency</div>
                  {(['USD', 'AMD', 'EUR', 'RUB', 'GEL'] as CurrencyCode[]).map((code) => (
                    <button
                      key={code}
                      onClick={() => handleCurrencyChange(code)}
                      className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                        currency === code
                          ? 'bg-gray-100 text-gray-900 font-semibold cursor-default'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className={`fixed inset-0 bg-gradient-to-b from-[#62b3e8] to-[rgba(11, 55, 168, 0.75)] backdrop-blur-sm z-[100] ${isDesktopScreen ? 'hidden' : 'xl:hidden'} flex items-center justify-center`} onClick={() => setShowMobileMenu(false)}>
            <div 
              className="relative rounded-2xl border shadow-2xl w-[280px] max-w-[90%] p-8 animate-in fade-in zoom-in-95 duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowMobileMenu(false)}
                className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Logo - Moved to top */}
              <div className="flex justify-center mb-6 -mt-2">
                <div
                  onClick={() => {
                    router.push('/');
                    setShowMobileMenu(false);
                  }}
                  className="h-[26px] relative shrink-0 w-[85px] cursor-pointer"
                >
                  <img 
                    alt="Borbor Aqua Logo" 
                    className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" 
                    src={imgBorborAguaLogoColorB2024Colored1} 
                  />
                </div>
              </div>

              {/* Menu Items */}
              <nav className="flex flex-col gap-6">
                <button
                  onClick={() => {
                    router.push('/about');
                    setShowMobileMenu(false);
                  }}
                  className="text-left text-gray-400 font-bold text-lg uppercase tracking-wide hover:text-gray-600 transition-colors"
                >
                  {t('home.navigation.aboutUs')}
                </button>
                <button
                  onClick={() => {
                    router.push('/contact');
                    setShowMobileMenu(false);
                  }}
                  className="text-left text-gray-400 font-bold text-lg uppercase tracking-wide hover:text-gray-600 transition-colors"
                >
                  {t('home.navigation.contactUs')}
                </button>
                <button
                  onClick={() => {
                    router.push('/blog');
                    setShowMobileMenu(false);
                  }}
                  className="text-left text-gray-400 font-bold text-lg uppercase tracking-wide hover:text-gray-600 transition-colors"
                >
                  {t('home.navigation.blog')}
                </button>
                <button
                  onClick={() => {
                    if (isLoggedIn) {
                      handleLogout();
                    } else {
                      router.push('/login');
                    }
                    setShowMobileMenu(false);
                  }}
                  className="text-left text-gray-400 font-bold text-lg uppercase tracking-wide hover:text-gray-600 transition-colors"
                >
                  {t('common.navigation.logout').toUpperCase()}
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Mobile Search Modal */}
        {showSearchModal && (
          <div 
            className="fixed inset-0 bg-[#62b3e8]/30 backdrop-blur-sm z-[100] flex items-start justify-center pt-16 px-4"
            onClick={() => setShowSearchModal(false)}
            style={{ touchAction: 'none' }}
          >
            <div
              ref={searchModalRef}
              className="w-full max-w-md animate-in fade-in slide-in-from-top-2 duration-200 relative z-[101]"
              onClick={(e) => e.stopPropagation()}
              style={{ touchAction: 'auto' }}
            >
              <form onSubmit={handleSearch} className="relative z-[102]">
                {/* Search Input with glassy effect */}
                <div className="relative z-[103]">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('home.search.placeholder')}
                    className="w-full h-12 pl-12 pr-4 bg-[#62b3e8]/80 backdrop-blur-md border-2 border-white/90 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white text-base placeholder:text-white/70 text-white shadow-lg pointer-events-auto relative z-[104] touch-manipulation"
                    autoFocus
                    autoComplete="off"
                    style={{ WebkitAppearance: 'none', WebkitTapHighlightColor: 'transparent' }}
                  />
                  {/* Search Icon inside input */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-[105]">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Background Gradient */}
        <div className="absolute bg-gradient-to-b blur-[50px] from-[#62b3e8] h-[850px] left-0 right-0 to-[rgba(221,216,216,0.75)] top-0 w-full" />

        {/* Mobile Hero Section Decorative Group — 140% size */}
        <div className="absolute inset-[15%_10%_70%_10%] sm:inset-[12%_10%_70%_10%] md:inset-[10%_10%_70%_10%] z-0 overflow-visible flex items-center justify-center">
          <div className="absolute left-1/2 top-1/2 w-[140%] h-[140%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <img alt="Decorative Group" className="block size-full object-contain object-center figma-fade-in" src={imgGroup2105} />
          </div>
        </div>

        {/* Mobile Decorative Background Images */}
        <div className="absolute h-[312px] left-0 right-0 top-[789px] w-full">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash3} />
          </div>
        </div>
        <div className="absolute flex h-[312px] items-center justify-center left-0 right-0 top-[1098px] w-full overflow-hidden pointer-events-none">
          <div className="-scale-y-100 flex-none w-full h-full">
            <div className="h-full relative w-full">
              <div className="absolute inset-0 overflow-hidden">
                <img
                  alt=""
                  className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full"
                  src={imgDanielSinocaAancLsb0SU0Unsplash3}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Footer Background Images - Removed */}

        {/* Mobile Decorative Ellipses and Shapes */}
        <div className="-translate-x-1/2 absolute h-[311px] left-[calc(50%+303.5px)] top-[2839px] w-[329px]">
          <div className="absolute inset-[-91.64%_-86.63%]">
            <img alt="" className="block max-w-none size-full" src={imgEllipse45} />
          </div>
        </div>
        <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+296.32px)] mix-blend-luminosity size-[537.421px] top-[2691px]">
          <div className="flex-none rotate-[55.86deg]">
            <div className="relative size-[386.94px]">
              <img alt="" className="block max-w-none size-full" src={imgShape} />
            </div>
          </div>
        </div>
      
       
        <div className="-translate-x-1/2 absolute h-[777px] left-[calc(50%+397.5px)] top-[1819px] w-[823px]">
          <div className="absolute inset-[-59.85%_-56.5%]">
            <img alt="" className="block max-w-none size-full" src={imgEllipse42} />
          </div>
        </div>
        <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+290.32px)] mix-blend-luminosity size-[537.421px] top-[2031.61px]">
          <div className="flex-none rotate-[55.86deg]">
            <div className="relative size-[386.94px]">
              <img alt="" className="block max-w-none size-full" src={imgShape} />
            </div>
          </div>
        </div>
        
        <div className="-translate-x-1/2 absolute h-[438px] left-[calc(50%-302px)] top-[1251px] w-[464px]">
          <div className="absolute inset-[-83.33%_-78.66%]">
            <img alt="" className="block max-w-none size-full" src={imgEllipse41} />
          </div>
        </div>


        {/* Mobile Featured Products — bulb.svg (medium, small, medium), float + drag */}
        <div className="absolute flex items-center justify-center left-[67.21%] right-[-23.97%] top-[calc(.09%+958px)] bottom-[calc(100%-82.65%)]">
          <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active-0 flex-none rotate-[100.79deg] size-[130px]" maxDrag={80} />
        </div>
        <div className="absolute flex items-center justify-center left-[47.67%] right-[4.12%] top-[calc(13.72%+958px)] bottom-[calc(100%-81.17%)]">
          <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active-3 flex-none rotate-[100.79deg] size-[50px]" maxDrag={50} />
        </div>
        {/* Left decorative bubble near Featured Products - fixed 200px from left on all mobile widths */}
       

       

        {/* Mobile Hero — bulb.svg centered, float + drag */}
        <div className="-translate-x-1/2 absolute flex items-center justify-center left-1/2 top-[190px] sm:top-[220px] md:top-[240px] w-full max-w-[440px] z-[2]">
          <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active-1 size-[320px] sm:size-[360px] md:size-[400px] flex items-center justify-center" maxDrag={110} />
        </div>


        {/* Mobile Hero Text */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-start justify-center left-1/2 top-[281px] w-full max-w-[380px] px-6 z-10">
          <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center text-left leading-[40px] relative shrink-0 text-[34px] text-white w-full whitespace-pre-wrap break-words">
            <p className="mb-0">{t('home.hero.your')}</p>
            <p className="mb-0 font-['Montserrat:Light',sans-serif] font-light">{t('home.hero.dailyDose')}</p>
            <p className="mb-0 font-['Montserrat:Light',sans-serif] font-light">{t('home.hero.of')}</p>
            <p className="mb-0">{t('home.hero.freshness')}</p>
          </div>
        </div>

        {/* Mobile Hero Text Bottom Gradient Overlay */}
        <div className="absolute bg-gradient-to-b blur-[40px] from-[rgba(98,179,232,0.85)] h-[150px] left-0 right-0 opacity-75 to-[rgba(221,216,216,0.6)] top-[520px] z-0" />

        {/* Mobile Experience Purity Label */}
        <div className="absolute content-stretch flex gap-[12px] items-center left-[32px] right-4 top-[261px] max-w-[calc(100%-32px)] z-[10]">
          <div className="bg-white h-[2px] shrink-0 w-[48px]" />
          <div className="content-stretch flex flex-col items-start relative shrink-0">
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-white tracking-[1.4px] uppercase whitespace-nowrap">
              <p className="leading-[20px]">{t('home.hero.experiencePurity')}</p>
            </div>
          </div>
        </div>

        {/* Mobile Subtitle */}
        <div className="absolute content-stretch flex flex-col items-center justify-center left-[32px] right-[32px] top-[494px]">
          <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white text-center break-words z-[10] ">
            <p className="leading-[26px]">{t('home.hero.subtitle')}</p>
          </div>
        </div>

        {/* Mobile Hero Section Bottom Gradient Overlay */}
        <div className="absolute bg-gradient-to-b blur-[40px] from-[rgba(98,179,232,0.8)] h-[150px] left-0 right-0 opacity-70 to-[rgba(221,216,216,0.6)] top-[700px] z-0" />

        {/* Mobile CTA Buttons */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[8px] h-[136px] items-center justify-end left-1/2 pt-[16px] top-[675px] w-full max-w-[430px] px-4 z-10">
          <button
            onClick={() => router.push('/products')}
            className="bg-[#31daff] content-stretch flex flex-col h-[60px] items-center justify-center px-[40px] py-[16px] relative rounded-[9999px] shrink-0 w-full max-w-[368px] cursor-pointer transition-all duration-300 hover:bg-[#00b8e6] hover:shadow-lg hover:shadow-[#31daff]/50 hover:scale-105 active:scale-95"
          >
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">
              <p className="leading-[24px]">{t('home.hero.shopNow')}</p>
            </div>
          </button>
          <button
            onClick={() => router.push('/about')}
            className="bg-[rgba(0,0,0,0)] border-2 border-white/30 content-stretch flex flex-col h-[60px] items-center justify-center px-[40px] py-[16px] relative rounded-[9999px] shrink-0 w-full max-w-[368px] cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-white/50 hover:shadow-lg hover:shadow-white/20 hover:scale-105 active:scale-95"
          >
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[19px] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
              <p className="leading-[24px] whitespace-nowrap">{t('home.hero.learnMore')}</p>
            </div>
          </button>
        </div>


        {/* Mobile Featured Products Gradient Overlay */}
        <div className="absolute bg-gradient-to-b blur-[30px] from-[#62b3e8] h-[300px] left-0 right-0 pointer-events-none to-[rgba(255, 255, 255, 0.07)] top-[738px] w-full z-[1]" data-node-id="3:2019" />

        {/* Mobile Featured Products Section */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[6px] items-center justify-center left-1/2 top-[923px] w-full max-w-[429px] px-4 z-10">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[30px] relative shrink-0 text-[28px] text-center text-white tracking-[-0.9px] uppercase break-words">
              <p className="mb-0">{t('home.featuredProducts.title')}</p>
            </div>
          </div>
          <div className="bg-[#00d1ff] h-[4px] rounded-[30px] shrink-0 w-[80px]" />
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-white break-words">
              <p className="leading-[20px]">{t('home.featuredProducts.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Left bulb — after Featured title, float + drag */}
        <div className="absolute flex items-center justify-center -left-20 right-auto top-[calc(0%+965px)] bottom-auto z-10 max-w-[130px] overflow-visible">
          <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active-7 flex-none rotate-[100.79deg] size-[130px]" maxDrag={80} />
        </div>

        {/* Mobile Featured Products - 2 products side by side */}
        {featuredProducts.length > 0 && (() => {
          const visibleProducts = featuredProducts.slice(carouselIndex, carouselIndex + 2);
          return (
            <div className="-translate-x-1/2 absolute content-stretch flex gap-[16px] items-center justify-center left-1/2 top-[1088px] w-full max-w-[400px] px-4">
              {visibleProducts.map((product) => (
                <FeaturedProductCard
                  key={product.id}
                  product={product}
                  router={router}
                  t={t}
                  isLoggedIn={isLoggedIn}
                  isAddingToCart={addingToCart.has(product.id)}
                  onAddToCart={handleAddToCart}
                  onProductClick={handleOpenProduct}
                  formatPrice={formatPrice}
                  currency={getStoredCurrency()}
                  isMobile={true}
                />
              ))}
            </div>
          );
        })()}

        {/* Mobile Carousel Navigation - Only show if 3 or more products */}
        {featuredProducts.length >= 3 && (
          <div className="-translate-x-1/2 absolute content-stretch flex items-center justify-between left-1/2 top-[1180px] w-full max-w-[500px] px-4">
            <FeaturedProductsNavigationArrow
              direction="prev"
              onClick={handlePreviousProducts}
              isMobile={true}
              className="bg-[#00d1ff]/90"
              ariaLabel={t('home.trustedBy.previousProducts')}
            />
            <FeaturedProductsNavigationArrow
              direction="next"
              onClick={handleNextProducts}
              isMobile={true}
              className="bg-[#00d1ff]/90"
              ariaLabel={t('home.trustedBy.nextProducts')}
            />
          </div>
        )}

        {/* Mobile Pagination Dots (interactive, synced with featured products carousel) - 2 products per page */}
        {featuredProducts.length > 2 && (() => {
          const totalPages = Math.ceil(featuredProducts.length / 2);
          const currentPage = Math.floor(carouselIndex / 2);
          return (
            <div className="-translate-x-1/2 absolute flex items-center justify-center gap-[10px] left-1/2 top-[1420px]">
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageIndex = index * 2;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCarouselIndex(pageIndex)}
                    className={`rounded-full transition-all duration-300 ${
                      carouselIndex === pageIndex || (carouselIndex >= pageIndex && carouselIndex < pageIndex + 2)
                        ? 'bg-[#00d1ff] h-[8px] w-[20px]'
                        : 'bg-white size-[8px] hover:bg-[#00d1ff]/50'
                    }`}
                    aria-label={t(`home.trustedBy.showFeaturedProductsPage${index + 1}`)}
                  />
                );
              })}
            </div>
          );
        })()}

        {/* Mobile View All Products Button */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center left-[calc(50%+1.5px)] top-[1500px] w-[241px]">
          <button
            onClick={() => router.push('/products')}
            className="border-2 border-[#e2e8f0] border-solid content-stretch flex gap-[8px] items-center px-[34px] py-[12px] relative rounded-[9999px] shrink-0 transition-all duration-300 hover:border-[#1ac0fd] hover:bg-[#1ac0fd]/5 hover:shadow-md hover:shadow-[#1ac0fd]/20 hover:scale-105 active:scale-95"
          >
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[16px] text-center whitespace-nowrap">
              <p className="leading-[24px]">{t('home.featuredProducts.viewAllProducts')}</p>
            </div>
            <div className="relative shrink-0">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative">
                <div className="flex items-center justify-center relative shrink-0">
                  <div className="flex-none scale-y-[-100%]">
                    <div className="h-[28px] relative w-[24.02px]">
                      <img alt="Arrow" className="block max-w-none size-full" src={img4} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Mobile Water Energy Section */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[9px] items-start left-[calc(50%+1.5px)] top-[1740px] lg:top-[1835px] w-full max-w-[429px] px-4">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[40px] text-center tracking-[-0.9px] uppercase w-[641px]">
            <p className="leading-[40px] whitespace-pre-wrap">{t('home.waterEnergy.title')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center relative shrink-0 w-full">
            <div className="flex items-center justify-center gap-2">
              <div className="bg-[#00d1ff] h-[6px] w-[6px] rounded-full transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Mobile Water Energy Content */}
        {waterEnergyLoading ? (
          <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center justify-center left-1/2 top-[1900px] w-full max-w-[429px] min-h-[400px] z-10">
            <div className="text-[#94a3b8] text-[16px]">Loading...</div>
          </div>
        ) : waterEnergyProducts.length > 0 ? (
          <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center left-1/2 top-[1900px] w-full max-w-[429px] z-10">
            {/* Product Card Carousel */}
            <div className="relative w-full max-w-[380px]">
              {(() => {
                const currentProduct = waterEnergyProducts[waterEnergyCarouselIndex] || waterEnergyProducts[0];
                if (!currentProduct) return null;

                // Extract volume from title or subtitle (e.g., "0.5L", "0.33L", "0.25L")
                const extractVolume = (product: Product): string | null => {
                  const title = product.title || '';
                  const subtitle = product.subtitle || '';
                  const combined = `${title} ${subtitle}`;
                  const volumeMatch = combined.match(/(\d+\.?\d*)\s*[Ll]/);
                  return volumeMatch ? `${volumeMatch[1]}L` : null;
                };

                const volume = extractVolume(currentProduct);
                const currency = getStoredCurrency();
                // Check if title contains "kids" or "favorite" to show favorite badge
                const hasFavoriteLabel = currentProduct.title?.toLowerCase().includes('kids') || 
                                        currentProduct.subtitle?.toLowerCase().includes('kids') ||
                                        false;

                return (
                  <div className="bg-[rgba(255,255,255,0.1)] border border-[#f1f5f9] border-solid content-stretch flex flex-col items-center justify-center overflow-clip p-[17px] relative rounded-[42px] shadow-[0px_10px_25px_-5px_rgba(0,0,0,0.05),0px_8px_10px_-6px_rgba(0,0,0,0.05)] w-full">
                    {/* Product Image Container with Navigation Arrows */}
                    <div className="relative w-full flex items-center justify-center mb-4">
                      {/* Left Arrow - Moved to Right */}
                      {waterEnergyProducts.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setWaterEnergyCarouselIndex((prev) => 
                              prev === 0 ? waterEnergyProducts.length - 1 : prev - 1
                            );
                          }}
                          className="absolute right-0 z-10 bg-[#1ac0fd] border-[0.5px] border-white/49 border-solid flex items-center justify-center rounded-full size-[40px] cursor-pointer hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:scale-95 transition-all duration-200"
                          aria-label="Previous product"
                        >
                          <svg
                            width="24"
                            height="28"
                            viewBox="0 0 24.02 28"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-[20px] w-[18px] transform scale-y-[-1]"
                          >
                            <path
                              d="M16.0692 13.0282H4.23242V14.9727H16.0692L10.6248 20.4171L12.0102 21.7782L19.788 14.0004L12.0102 6.22266L10.6248 7.58377L16.0692 13.0282Z"
                              fill="white"
                            />
                          </svg>
                        </button>
                      )}

                      {/* Product Image */}
                      <div className="h-[232px] relative shrink-0 w-[183px] flex items-center justify-center">
                        {currentProduct.image ? (
                          <img
                            alt={currentProduct.title}
                            src={currentProduct.image}
                            className="h-full w-auto object-contain"
                          />
                        ) : (
                          <div className="h-full w-full bg-[#e2e8f0] rounded-lg flex items-center justify-center">
                            <span className="text-[#94a3b8] text-[12px]">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Right Arrow - Moved to Left */}
                      {waterEnergyProducts.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setWaterEnergyCarouselIndex((prev) => 
                              prev === waterEnergyProducts.length - 1 ? 0 : prev + 1
                            );
                          }}
                          className="absolute left-0 z-10 bg-[#1ac0fd] border-[0.5px] border-white/49 border-solid flex items-center justify-center rounded-full size-[40px] cursor-pointer hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:scale-95 transition-all duration-200"
                          aria-label="Next product"
                        >
                          <svg
                            width="24"
                            height="28"
                            viewBox="0 0 24.02 28"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-[20px] w-[18px] transform rotate-180 scale-y-[-1]"
                          >
                            <path
                              d="M16.0692 13.0282H4.23242V14.9727H16.0692L10.6248 20.4171L12.0102 21.7782L19.788 14.0004L12.0102 6.22266L10.6248 7.58377L16.0692 13.0282Z"
                              fill="white"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="w-full">
                      <div className="content-stretch flex flex-col items-start pb-[28px] pt-[4px] relative shrink-0 w-full">
                        <div className="h-[71px] mb-[-24px] relative shrink-0 w-full">
                          {/* Favorite Badge */}
                          {hasFavoriteLabel && (
                            <div className="absolute content-stretch flex items-center left-0 right-0 top-0">
                              <div className="bg-[rgba(255,255,255,0.72)] content-stretch flex flex-col items-start px-[8px] py-[2px] relative rounded-[9999px] shrink-0">
                                <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#00b7ff] text-[10px] tracking-[0.5px] uppercase whitespace-nowrap">
                                  <p className="leading-[15px]">{t('home.waterEnergy.favorite')}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Product Title */}
                          <div className="absolute content-stretch flex flex-col items-start left-0 right-0 top-[23px]">
                            <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-full">
                              <p className="leading-[25px] whitespace-pre-wrap">{currentProduct.title}</p>
                            </div>
                          </div>

                          {/* Volume */}
                          {volume && (
                            <div className="absolute content-stretch flex flex-col items-start left-0 right-0 top-[51px]">
                              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[12px] tracking-[1.2px] uppercase whitespace-nowrap">
                                <p className="leading-[16px]">{volume}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Price and Order Button */}
                        <div className="content-stretch flex flex-col items-center justify-center mb-[-24px] pt-[16px] relative shrink-0 w-full">
                        <div className="content-stretch flex gap-[101px] items-center justify-center relative shrink-0 w-full">
                            {/* Price */}
                            <div className="content-stretch flex flex-col items-start min-w-[98.28px] relative shrink-0">
                              <div className="content-stretch flex items-center justify-center relative shrink-0">
                                <div className="flex flex-col font-['Inter:Black',sans-serif] font-black h-[28px] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white w-[92px]">
                                  <p className="leading-[28px] whitespace-pre-wrap">
                                    {formatPrice(currentProduct.price, currency)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Order Now Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart(currentProduct);
                              }}
                              disabled={addingToCart.has(currentProduct.id) || !currentProduct.inStock}
                              className="bg-[#1ac0fd] content-stretch cursor-pointer flex h-[56px] items-center justify-center overflow-clip pb-[10.5px] pt-[9.5px] px-[24px] relative rounded-[78px] shrink-0 w-[151px] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-[#00b8e6] hover:shadow-lg hover:shadow-[#1ac0fd]/50 hover:scale-105 active:scale-95"
                            >
                              <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
                                <p className="leading-[20px]">
                                  {addingToCart.has(currentProduct.id) 
                                    ? t('home.featuredProducts.adding') 
                                    : t('home.waterEnergy.orderNow')}
                                </p>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Pagination Dots */}
            {waterEnergyProducts.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {waterEnergyProducts.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setWaterEnergyCarouselIndex(index)}
                    className={`rounded-full transition-all duration-300 ${
                      waterEnergyCarouselIndex === index
                        ? 'bg-[#00d1ff] h-[6px] w-[20px]'
                        : 'bg-white h-[6px] w-[6px] hover:bg-[#00d1ff]/50'
                    }`}
                    aria-label={`Go to product ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Fallback: Show message if no products available
          <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center justify-center left-1/2 top-[1900px] w-full max-w-[429px] min-h-[400px] z-10">
            <div className="bg-[rgba(255,255,255,0.1)] border border-[#f1f5f9] border-solid content-stretch flex flex-col items-center justify-center overflow-clip p-[40px] relative rounded-[42px] shadow-[0px_10px_25px_-5px_rgba(0,0,0,0.05),0px_8px_10px_-6px_rgba(0,0,0,0.05)] w-full">
              <div className="text-[#94a3b8] text-[14px] text-center">
                {t('home.waterEnergy.title')} - {t('home.featuredProducts.viewAllProducts')}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Stats Cards */}
        <div className="-translate-x-1/2 absolute content-stretch flex gap-[8px] items-start left-1/2 top-[2462px] w-full max-w-[400px] px-4">
          <div className="h-[227px] relative rounded-[30px] shrink-0 w-[calc(50%-4px)] min-w-0 overflow-hidden">
            <img
              alt=""
              className="absolute h-[149.05%] left-[-49.49%] max-w-none top-[-32.36%] w-[149.49%]"
              src={imgScreenshot20260114At0835551}
            />
          </div>
          <div className="h-[227px] relative shrink-0 w-[calc(50%-4px)] min-w-0">
            <div className="absolute bg-[#1ac0fd] inset-0 rounded-[30px]" />
            <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[70%_6%_18%_40%] justify-center leading-[0] text-[40px] text-center text-white tracking-[-0.9px] uppercase">
              <p className="leading-[36px] whitespace-pre-wrap">98%</p>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[6%_10%_40%_10%] justify-center leading-[22px] text-[18px] text-white text-left tracking-[-0.9px] uppercase break-words">
              <p className="mb-0">{t('home.cards.pureSpringWater.pure')}</p>
              <p className="mb-0">{t('home.cards.pureSpringWater.spring')}</p>
              <p className="mb-0">{t('home.cards.pureSpringWater.water')}</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light mb-0">{t('home.cards.pureSpringWater.from')}</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light">{t('home.cards.pureSpringWater.armenia')}</p>
            </div>
            <div className="absolute flex flex-col font-['Inter:Medium_Italic',sans-serif] font-medium inset-[82%_8%_6%_40%] italic justify-center leading-[0] text-[12px] text-right text-white">
              <p className="leading-[18px] whitespace-pre-wrap">{t('home.cards.pureSpringWater.source')}</p>
            </div>
          </div>
        </div>

        <div className="-translate-x-1/2 absolute content-stretch flex gap-[8px] items-start left-1/2 top-[2708px] w-full max-w-[400px] px-4">
          <div className="h-[227px] relative shrink-0 w-[calc(50%-4px)] min-w-0">
            <div className="absolute bg-white inset-0 rounded-[30px]" />
            <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[65%_6%_18%_26%] justify-center leading-[0] text-[#0f172a] text-[40px] text-center tracking-[-0.9px] uppercase">
              <p className="leading-[36px] whitespace-pre-wrap">100%</p>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[6%_10%_40%_10%] justify-center leading-[22px] text-[#1ac0fd] text-[18px] tracking-[-0.9px] uppercase break-words">
              <p className="mb-0">{t('home.cards.balancedHydration.balanced')}</p>
              <p className="mb-0">{t('home.cards.balancedHydration.hydration')}</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light mb-0">{t('home.cards.balancedHydration.every')}</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light">{t('home.cards.balancedHydration.day')}</p>
            </div>
            <div className="absolute flex flex-col font-['Inter:Medium_Italic',sans-serif] font-medium inset-[84.65%_8.65%_6.46%_44.71%] italic justify-center leading-[0] text-[#1ac0fd] text-[14px] text-right">
              <p className="leading-[24px] whitespace-pre-wrap">{t('home.cards.balancedHydration.source')}</p>
            </div>
          </div>
          <div className="h-[227px] relative rounded-[30px] shrink-0 w-[calc(50%-4px)] min-w-0 overflow-hidden">
            <img
              alt=""
              className="absolute h-[101.64%] left-[-13.07%] max-w-none top-[-1.52%] w-[126.15%]"
              src={imgScreenshot20260112At1535403}
            />
          </div>
        </div>

        {/* Mobile Trusted By Background Ellipse */}
        <div className="-translate-x-1/2 absolute flex items-center justify-center left-1/2 top-[3100px] w-full h-[500px] z-0 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <img alt="Trusted By Background" className="block max-w-none w-[150%] h-[150%] object-cover opacity-30" src={imgEllipse41} />
          </div>
        </div>

        {/* Mobile Trusted By Section */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[9px] items-center justify-center left-[calc(50%+0.5px)] top-[3113px] w-full max-w-[429px] z-10">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[40px] text-center tracking-[-0.9px] uppercase w-full">
                <p className="leading-[40px] whitespace-pre-wrap">{t('home.trustedBy.title')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center relative shrink-0 w-full">
            <div className="-scale-y-100 flex-none w-full">
              <div className="content-stretch flex h-[9px] items-start justify-center relative w-full">
                <div className="bg-[#00d1ff] h-[5px] rounded-[30px] shrink-0 w-[90px]" />
              </div>
            </div>
          </div>
          <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[14px] text-center  whitespace-nowrap">
            <p className="leading-[16px]">{t('home.trustedBy.subtitle')}</p>
          </div>
        </div>

        {/* Mobile Trusted By Logo - uses same 3 logos as desktop via trustedByIndex */}
        <div className="-translate-x-1/2 absolute content-stretch flex items-center justify-center left-1/2 top-[3285px] w-full z-0">
          <div className="h-[72px] relative shrink-0 w-[260px]">
            <img
              alt={TRUSTED_BY_LOGOS[trustedByIndex].alt}
              className="absolute inset-0 max-w-none object-contain pointer-events-none size-full"
              src={TRUSTED_BY_LOGOS[trustedByIndex].src}
            />
          </div>
        </div>

        {/* Mobile Trusted By Navigation - same handlers as desktop */}
        <div className="-translate-x-1/2 absolute content-stretch flex h-[41px] items-center justify-between left-1/2 top-[3285px] w-full max-w-[470px] px-4 z-20">
          <FeaturedProductsNavigationArrow
            direction="prev"
            onClick={handlePreviousTrustedBy}
            isMobile={true}
            className="bg-transparent border-black border-solid [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
            ariaLabel="Previous partner"
          />
          <FeaturedProductsNavigationArrow
            direction="next"
            onClick={handleNextTrustedBy}
            isMobile={true}
            className="bg-transparent border-black border-solid [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
            ariaLabel="Next partner"
          />
        </div>

        {/* Mobile Trusted By Pagination Dots */}
        <div className="-translate-x-1/2 absolute flex items-center justify-center gap-[10px] left-1/2 top-[3426px]">
          <button
            type="button"
            onClick={() => setTrustedByIndex(0)}
            className={`rounded-full transition-all duration-300 ${
              trustedByIndex === 0
                ? 'bg-[#00d1ff] h-[8px] w-[20px]'
                : 'bg-white size-[8px] hover:bg-[#00d1ff]/50'
            }`}
            aria-label="Show first partner"
          />
          <button
            type="button"
            onClick={() => setTrustedByIndex(1)}
            className={`rounded-full transition-all duration-300 ${
              trustedByIndex === 1
                ? 'bg-[#00d1ff] h-[8px] w-[20px]'
                : 'bg-white size-[8px] hover:bg-[#00d1ff]/50'
            }`}
            aria-label="Show second partner"
          />
          <button
            type="button"
            onClick={() => setTrustedByIndex(2)}
            className={`rounded-full transition-all duration-300 ${
              trustedByIndex === 2
                ? 'bg-[#00d1ff] h-[8px] w-[20px]'
                : 'bg-white size-[8px] hover:bg-[#00d1ff]/50'
            }`}
            aria-label={t('home.trustedBy.showThirdPartner')}
          />
        </div>

        {/* Mobile Spacer Block - Reduces scroll */}
        <div className="-translate-x-1/2 absolute left-1/2 top-[3500px] w-full h-[50px]" />

     

        {/* Mobile Footer - Removed from all pages */}
      </div>

      {/* Desktop Version - Only for extra large screens (zoom-independent) */}
      <div
        ref={containerRef}
        className={`${isDesktopScreen ? 'block' : 'hidden xl:block'} bg-white relative w-full mx-auto h-[6170px] home-page-container overflow-x-hidden overflow-y-hidden`}
      >
      <Header
        router={router}
        t={t}
        setShowSearchModal={setShowSearchModal}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        setShowUserMenu={setShowUserMenu}
        showUserMenu={showUserMenu}
        handleLogout={handleLogout}
        userMenuRef={userMenuRef}
        isHomePage={true}
      />

      {/* Background Gradient */}
      <div className="absolute bg-gradient-to-b blur-[50px] from-[#62b3e8] h-[1075px] left-1/2 to-[rgba(221,216,216,0.75)] top-0 translate-x-[-50%] w-full max-w-[1920px]" />

      {/* Hero Section Decorative Group — 140% size */}
      <div className="absolute inset-[4.14%_16.2%_92%_14.64%] overflow-visible flex items-center justify-center">
        <div className="absolute left-1/2 top-1/2 w-[140%] h-[140%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <img alt="Decorative Group" className="block size-full object-contain object-center figma-fade-in" src={imgGroup2105} />
        </div>
      </div>

      {/* Hero decorative ball (bulb.svg) — drag to move a little */}
      <div className="absolute left-1/2 top-[315px] flex size-[606px] -translate-x-1/2 items-center justify-center pointer-events-auto md:top-[315px] sm:top-[252px]">
        <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active size-full flex items-center justify-center" maxDrag={140} />
      </div>

       
      

      {/* Hero Section - Main Content */}
      <div className="absolute content-stretch flex items-end justify-center left-[calc(50%+0.5px)] px-[20px] md:px-[16px] sm:px-[12px] top-[480px] lg:top-[480px] md:top-[400px] sm:top-[280px] translate-x-[-50%] w-[800px] lg:w-[800px] md:w-[90%] sm:w-[95%]">
        <div className="content-stretch flex flex-col gap-[20px] lg:gap-[20px] md:gap-[20px] sm:gap-[16px] items-center justify-center relative shrink-0 w-[800px] lg:w-[800px] md:w-full sm:w-full">
          {/* Experience Purity Label */}
          <div className="content-stretch flex gap-[10px] lg:gap-[10px] md:gap-[10px] sm:gap-[8px] items-center relative shrink-0 w-full">
            <div className="bg-white h-[2px] lg:h-[2px] md:h-[1.5px] sm:h-[1.5px] shrink-0 w-[40px] lg:w-[40px] md:w-[40px] sm:w-[32px]" />
            <div className="content-stretch flex flex-col items-start relative shrink-0">
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] lg:text-[12px] md:text-[12px] sm:text-[11px] text-white tracking-[1.2px] lg:tracking-[1.2px] md:tracking-[1.2px] sm:tracking-[1px] uppercase whitespace-nowrap">
                <p className="leading-[18px] lg:leading-[18px] md:leading-[18px] sm:leading-[16px]">{t('home.hero.experiencePurity')}</p>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[80px] lg:text-[80px] md:text-[64px] sm:text-[36px] text-center text-white w-full">
              <p className="whitespace-pre-wrap">
                <span className="leading-[80px] lg:leading-[80px] md:leading-[64px] sm:leading-[40px] text-white font-black">{t('home.hero.your')} </span>
                <span className="font-['Montserrat',sans-serif] font-light leading-[80px] lg:leading-[80px] md:leading-[64px] sm:leading-[40px] text-white">{t('home.hero.dailyDose')} </span>
                <span className="font-['Montserrat',sans-serif] font-light leading-[80px] lg:leading-[80px] md:leading-[64px] sm:leading-[40px] text-white">{t('home.hero.of')} </span>
                <span className="leading-[80px] lg:leading-[80px] md:leading-[64px] sm:leading-[40px] text-white font-black">{t('home.hero.freshness')}</span>
              </p>
            </div>
          </div>

          {/* Subtitle */}
          <div className="content-stretch flex flex-col items-center justify-center max-w-[450px] lg:max-w-[450px] md:max-w-[400px] sm:max-w-[280px] relative shrink-0 w-[450px] lg:w-[450px] md:w-full sm:w-full">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[18px] sm:text-[14px] text-white whitespace-nowrap">
              <p className="leading-[28px] lg:leading-[28px] md:leading-[28px] sm:leading-[22px]">{t('home.hero.subtitle')}</p>
            </div>
          </div>

          <Button router={router} t={t} />
        </div>
      </div>

      {/* Water Wave Graphic */}
      <div className="absolute left-0 right-0 h-[527px] top-[1050px] w-full z-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="Water Wave" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash1} />
        </div>
      </div>

      {/* Decorative Elements - Ellipses */}
      <div className="absolute h-[1124px] left-[calc(50%+953.5px)] top-[2396px] translate-x-[-50%] w-[1191px] overflow-hidden">
        <div className="absolute inset-0 figma-float">
          <img alt="Ellipse" className="block max-w-none size-full" src={imgEllipse41} />
        </div>
      </div>

      <div className="absolute h-[1051px] left-1/2 top-[4100px] translate-x-[-50%] w-[2808px] overflow-hidden "  >
        <div className="absolute inset-0 figma-float">
          <img alt="Ellipse" className="block max-w-none size-full" src={imgEllipse44} />
        </div>
      </div>

      <div className="absolute h-[1124px] left-[calc(50%-1113.5px)] top-[3102px] translate-x-[-50%] w-[1191px] overflow-hidden">
        <div className="absolute inset-0 figma-float">
          <img alt="Ellipse" className="block max-w-none size-full" src={imgEllipse42} />
        </div>
      </div>

      <div className="absolute h-[1124px] left-[calc(50%+986px)] top-[3116px] translate-x-[-50%] w-[1422px] overflow-hidden">
        <div className="absolute inset-0 figma-float">
          <img alt="Ellipse" className="block max-w-none size-full" src={imgEllipse43} />
        </div>
      </div>

      {/* Decorative Shapes */}
      <div className="absolute flex items-center justify-center left-[calc(50%+846.59px)] size-[1045.176px] top-[2628px] translate-x-[-50%]">
        <div className="flex-none rotate-[-56.31deg]">
          <div className="relative size-[753.698px]">
            <img alt="Shape" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
      </div>

      <div className="absolute flex items-center justify-center left-[calc(50%-587.04px)] size-[541.928px] top-[3100px] translate-x-[-50%]">
        <div className="flex-none rotate-[-165deg]">
          <div className="relative size-[524.132px]">
            <img alt="Shape" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="absolute left-0 right-0 h-[1050px] lg:h-[1050px] md:h-[900px] sm:h-[700px] top-[1150px] lg:top-[1150px] md:top-[1000px] sm:top-[800px] w-full overflow-hidden">
        {/* Background Image - Daniel Sianca Flipped */}
        <div
          className="absolute w-full h-full"
          style={{
            top: "40%",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${imgDanielSinocaAancLsb0SU0Unsplash1})`,
            backgroundSize: "100%",
            backgroundPosition: "center bottom",
            backgroundRepeat: "no-repeat",
            transform: "scaleY(-1)", // նույն flip-ը
          }}
        />
        {/* Gradient fade overlay - վերևում իրական գույն, կամաց-կամաց սպիտակի */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            
            background: "linear-gradient(to bottom, transparent 0%, transparent 10%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0) 65%, rgba(255, 255, 255, 0.3) 80%, white 100%)"
          }}
        />
        <div className="absolute h-[870px] lg:h-[870px] md:h-[750px] sm:h-[600px] left-1/2 translate-x-[-50%] w-[980px] lg:w-[980px] md:w-[90%] sm:w-[95%] top-[160px] lg:top-[160px] md:top-[130px] sm:top-[100px] relative z-10">
          {/* Section Header */}
          <div className="absolute content-stretch flex flex-col gap-[14px] lg:gap-[14px] md:gap-[12px] sm:gap-[10px] items-start left-0 lg:left-0 md:left-[16px] sm:left-[12px] right-0 lg:right-0 md:right-[16px] sm:right-[12px] top-[8px] lg:top-[8px] md:top-[0px] sm:top-[0px]">
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[60px] lg:text-[60px] md:text-[48px] sm:text-[32px] text-center text-white tracking-[-0.8px] lg:tracking-[-0.8px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
                <p className="leading-[36px] lg:leading-[36px] md:leading-[32px] sm:leading-[28px]">{t('home.featuredProducts.title')}</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full mt-[16px] lg:mt-[16px]">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center text-white whitespace-nowrap">
                <p className="leading-[22px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px]">{t('home.featuredProducts.subtitle')}</p>
              </div>
            </div>
          </div>


          

          {/* Products Grid - Uniform Layout (lowered so bottles don't cover section header) */}
          <div className="absolute h-[390px] lg:h-[390px] md:h-[330px] sm:h-[270px] left-0 lg:left-0 md:left-[16px] sm:left-[12px] right-0 lg:right-0 md:right-[16px] sm:right-[12px] top-[270px] lg:top-[270px] md:top-[240px] sm:top-[195px] z-[10]">
            {productsLoading ? (
              // Loading state - show placeholder with uniform grid
              <div className="flex gap-[32px] lg:gap-[32px] md:gap-[30px] sm:gap-[20px] justify-center items-start h-full">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-[20px] lg:gap-[20px] md:gap-[24px] sm:gap-[24px] w-[280px] lg:w-[280px] md:w-[280px] sm:w-[240px] bg-transparent">
                    <div className="h-[280px] lg:h-[280px] md:h-[280px] sm:h-[240px] w-full bg-gray-300 animate-pulse rounded-lg overflow-hidden" />
                    <div className="w-full flex flex-col gap-[16px] px-[16px]">
                      <div className="h-4 bg-gray-300 animate-pulse rounded w-3/4" />
                      <div className="h-6 bg-gray-300 animate-pulse rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              // Render actual products - show 3 at a time based on carouselIndex with uniform grid
              <div className="flex gap-[32px] lg:gap-[32px] md:gap-[30px] sm:gap-[20px] justify-center items-start h-full">
                {(() => {
                  const visibleProducts = featuredProducts.slice(carouselIndex, carouselIndex + 3);
                  const currency = getStoredCurrency();
                  return visibleProducts.map((product) => (
                    <FeaturedProductCard
                      key={product.id}
                      product={product}
                      router={router}
                      t={t}
                      isLoggedIn={isLoggedIn}
                      isAddingToCart={addingToCart.has(product.id)}
                      onAddToCart={handleAddToCart}
                      onProductClick={handleOpenProduct}
                      formatPrice={formatPrice}
                      currency={currency}
                    />
                  ));
                })()}
              </div>
            ) : null}
          </div>


          {/* Pagination Dots - Show 3 dots for 3 carousel modes (positioned above "View All Products" on non-mobile) */}
          {featuredProducts.length > 3 && (
            <div className="absolute contents left-1/2 top-[580px] lg:top-[580px] md:top-[380px] sm:top-[330px] translate-x-[-50%]">
              {/* Dot 1 - First mode (products 0-2) */}
              <button
                type="button"
                onClick={() => setCarouselIndex(0)}
                className={`absolute rounded-full top-[580px] lg:top-[580px] md:top-[380px] sm:top-[330px] translate-x-[-50%] transition-all duration-300 ${
                  carouselIndex === 0
                    ? 'bg-[#00d1ff] h-[6px] w-[16px] left-[calc(50%-17px)]'
                    : 'bg-[#e2e8f0] size-[6px] left-[calc(50%-17px)] hover:bg-[#00d1ff]/50'
                }`}
                aria-label={t('home.trustedBy.showFirst3Products')}
              />
              {/* Dot 2 - Second mode (products 3-5) */}
              <button
                type="button"
                onClick={() => setCarouselIndex(3)}
                className={`absolute rounded-full top-[580px] lg:top-[580px] md:top-[380px] sm:top-[330px] translate-x-[-50%] transition-all duration-300 ${
                  carouselIndex === 3
                    ? 'bg-[#00d1ff] h-[6px] w-[16px] left-1/2'
                    : 'bg-[#e2e8f0] size-[6px] left-1/2 hover:bg-[#00d1ff]/50'
                }`}
                aria-label={t('home.trustedBy.showSecond3Products')}
              />
              {/* Dot 3 - Third mode (products 6-8) */}
              <button
                type="button"
                onClick={() => setCarouselIndex(6)}
                className={`absolute rounded-full top-[580px] lg:top-[580px] md:top-[380px] sm:top-[330px] translate-x-[-50%] transition-all duration-300 ${
                  carouselIndex === 6
                    ? 'bg-[#00d1ff] h-[6px] w-[16px] left-[calc(50%+17px)]'
                    : 'bg-[#e2e8f0] size-[6px] left-[calc(50%+17px)] hover:bg-[#00d1ff]/50'
                }`}
                aria-label={t('home.trustedBy.showThird3Products')}
              />
            </div>
          )}

          {/* View All Products Button */}
          <div className="absolute content-stretch flex flex-col items-center left-[20px] lg:left-[20px] md:left-[16px] sm:left-[12px] right-[20px] lg:right-[20px] md:right-[16px] sm:right-[12px] top-[620px] lg:top-[620px] md:top-[420px] sm:top-[370px]">
            <div
              onClick={() => router.push('/products')}
              className="border-2 border-[#e2e8f0] border-solid content-stretch flex gap-[7px] lg:gap-[7px] md:gap-[6px] sm:gap-[4px] items-center px-[30px] lg:px-[30px] md:px-[28px] sm:px-[20px] py-[10px] lg:py-[10px] md:py-[10px] sm:py-[8px] relative rounded-[9999px] shrink-0 cursor-pointer hover:border-[#00d1ff] hover:bg-[#00d1ff]/5 transition-all"
            >
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center whitespace-nowrap">
                <p className="leading-[22px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px]">{t('home.featuredProducts.viewAllProducts')}</p>
              </div>
              <div className="relative shrink-0">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative">
                  <div className="flex items-center justify-center relative shrink-0">
                    <div className="flex-none scale-y-[-100%]">
                      <div className="h-[28px] relative w-[24.02px]">
                        <img alt="Arrow" className="block max-w-none size-full" src={img4} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blue Underline */}
          <div className="absolute content-stretch flex items-start justify-center left-1/2 top-[50px] lg:top-[67px] md:top-[50px] sm:top-[110px] translate-x-[-50%] w-[980px] lg:w-[980px] md:w-[90%] sm:w-[95%]">
            <div className="bg-[#00d1ff] h-[4px] lg:h-[4px] md:h-[5px] sm:h-[5px] rounded-[25px] lg:rounded-[25px] md:rounded-[30px] sm:rounded-[30px] shrink-0 w-[80px] lg:w-[80px] md:w-[90px] sm:w-[90px]" />
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Only show if we have more than 3 products - Outside overflow-hidden container */}
      {featuredProducts.length > 3 && (
        <>
          {/* Next Button - Left side (աջ տանի) */}
          <FeaturedProductsNavigationArrow
            direction="next"
            onClick={(e?: React.MouseEvent) => {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
              console.log('🖱️ [CAROUSEL] Next button clicked');
              handleNextProducts(e);
            }}
            className="left-[calc(50%-580px)] lg:left-[calc(50%-580px)] md:left-[calc(50%-500px)] sm:left-[calc(50%-400px)] top-[1580px] lg:top-[1580px] md:top-[1350px] sm:top-[1090px]"
            ariaLabel={t('home.trustedBy.nextProducts')}
          />

          {/* Previous Button - Right side (ձախ տանի) */}
          <FeaturedProductsNavigationArrow
            direction="prev"
            onClick={(e?: React.MouseEvent) => {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
              console.log('🖱️ [CAROUSEL] Previous button clicked');
              handlePreviousProducts(e);
            }}
            className="right-[calc(50%-580px)] lg:right-[calc(50%-580px)] md:right-[calc(50%-500px)] sm:right-[calc(50%-400px)] top-[1580px] lg:top-[1580px] md:top-[1350px] sm:top-[1110px]"
            ariaLabel={t('home.trustedBy.previousProducts')}
          />
        </>
      )}
 {/* <div className="absolute left-0 right-0 top-[2388px] lg:top-[2590px] md:top-[1986px] sm:top-[1586px] h-[6px] bg-white z-[5]" /> */}

      {/* Seam fix above Water Energy (covers tiny line between sections) */}
      <div className="absolute left-0 right-0 top-[2108px] lg:top-[2200px] md:top-[1806px] sm:top-[1396px] h-[6px] bg-white z-[100]" />

      {/* Water Energy Section */}
      <div className="absolute content-stretch flex flex-col gap-[30px] lg:gap-[30px] md:gap-[28px] sm:gap-[20px] items-start left-1/2 top-[2350px] lg:top-[2350px] md:top-[2000px] sm:top-[1600px] translate-x-[-50%] w-[980px] lg:w-[980px] md:w-[90%] sm:w-[95%]">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[60px] lg:text-[60px] md:text-[48px] sm:text-[32px] text-center tracking-[-0.8px] lg:tracking-[-0.8px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase w-[570px] lg:w-[570px] md:w-[500px] sm:w-full">
              <p className="leading-[36px] lg:leading-[36px] md:leading-[32px] sm:leading-[28px] whitespace-pre-wrap">{t('home.waterEnergy.title')}</p>
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-start justify-center relative shrink-0 w-full">
          <div className="bg-[#00d1ff] h-[4px] lg:h-[4px] md:h-[5px] sm:h-[5px] rounded-[25px] lg:rounded-[25px] md:rounded-[30px] sm:rounded-[30px] shrink-0 w-[80px] lg:w-[80px] md:w-[90px] sm:w-[90px]" />
        </div>
      </div>

      {/* Pure Spring Water / Balanced Hydration Cards */}
      {/* Container for cards - centered and zoom-stable */}
      <div className="absolute left-1/2 translate-x-[-110%] lg:translate-x-[-50%] top-[3200px] lg:top-[3200px] md:top-[2800px] sm:top-[2200px] w-[980px] lg:w-[980px] md:w-[90%] sm:w-[95%] -ml-[350px]">
        {/* Blue Card (98%) */}
        <div className="absolute h-[192px] lg:h-[300px] md:h-[280px] sm:h-[200px] left-[calc(50%+27.08%)] lg:left-[650px] md:left-[38%] sm:left-[5%] top-0 w-[448px] lg:w-[700px] md:w-[60%] sm:w-[90%]">
          <div className="absolute bg-[#1ac0fd] inset-0 rounded-[21px] lg:rounded-[32px] md:rounded-[30px] sm:rounded-[24px]" />
          <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[65.89%_3.9%_22.45%_69.14%] lg:inset-[65.89%_3.9%_22.45%_69.14%] md:inset-[65.89%_3.9%_22.45%_69.14%] sm:inset-[65.89%_3.9%_22.45%_69.14%] justify-center leading-[0] text-[54px] lg:text-[84px] md:text-[72px] sm:text-[56px] text-center text-white tracking-[-0.8px] lg:tracking-[-0.8px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
            <p className="leading-[23px] lg:leading-[36px] md:leading-[32px] sm:leading-[28px]">{t('home.cards.pureSpringWater.percentage')}</p>
          </div>
          <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[12.83%_29.35%_58.02%_5.29%] lg:inset-[12.83%_29.35%_58.02%_5.29%] md:inset-[12.83%_29.35%_58.02%_5.29%] sm:inset-[12.83%_29.35%_58.02%_5.29%] justify-center leading-[28px] lg:leading-[44px] md:leading-[40px] sm:leading-[32px] text-[26px] lg:text-[40px] md:text-[36px] sm:text-[28px] text-white tracking-[-0.8px] lg:tracking-[-0.8px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
            <p className="mb-0">{t('home.cards.pureSpringWater.title')}</p>
            <p className="font-['Montserrat',sans-serif] font-light">{t('home.cards.pureSpringWater.subtitle')}</p>
          </div>
          <div className="absolute flex flex-col font-['Inter',sans-serif] font-medium inset-[83.67%_3.9%_9.33%_82.24%] lg:inset-[83.67%_3.9%_9.33%_82.24%] md:inset-[83.67%_3.9%_9.33%_82.24%] sm:inset-[83.67%_3.9%_9.33%_82.24%] italic justify-center leading-[0] text-[10px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center text-white whitespace-nowrap">
            <p className="leading-[14px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px]">{t('home.cards.pureSpringWater.source')}</p>
          </div>
        </div>

        {/* Side Image Left */}
        <div className="absolute h-[192px] lg:h-[300px] md:h-[280px] sm:h-[240px] left-[calc(50%-27.08%-224px)] lg:left-[350px] md:left-[20.5%] sm:left-[5%] top-0 w-[173px] lg:w-[270px] md:w-[25%] sm:w-[40%]">
          <div className="absolute inset-0 rounded-[21px] lg:rounded-[32px] md:rounded-[30px] sm:rounded-[24px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[21px] lg:rounded-[32px] md:rounded-[30px] sm:rounded-[24px]">
              <img alt="Screenshot" className="absolute h-[149.05%] left-[-32.81%] max-w-none top-[-32.36%] w-[132.81%]" src={img5} />
            </div>
          </div>
        </div>
      </div>

      {/* White Card (100%) Container */}
      <div className="absolute left-1/2 translate-x-[-110%] lg:translate-x-[-50%] top-[3520px] lg:top-[3520px] md:top-[3100px] sm:top-[2500px] w-[980px] lg:w-[980px] md:w-[90%] sm:w-[95%] -ml-[350px]">
        {/* White Card (100%) */}
        <div className="absolute h-[192px] lg:h-[300px] md:h-[280px] sm:h-[20px] left-[calc(50%-27.08%)] lg:left-[350px] md:left-[20.5%] sm:left-[5%] top-0 w-[448px] lg:w-[700px] md:w-[60%] sm:w-[90%]">
          <div className="absolute bg-white inset-0 rounded-[21px] lg:rounded-[32px] md:rounded-[30px] sm:rounded-[24px] shadow-[0_20px_60px_rgba(15,23,42,0.20)]" />
          <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[69.68%_60%_18.66%_7.42%] lg:inset-[69.68%_60%_18.66%_7.42%] md:inset-[69.68%_60%_18.66%_7.42%] sm:inset-[69.68%_60%_18.66%_7.42%] justify-center leading-[0] text-[#0f172a] text-[54px] lg:text-[84px] md:text-[72px] sm:text-[56px] text-center tracking-[-0.8px] lg:tracking-[-0.8px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
            <p className="leading-[23px] lg:leading-[36px] md:leading-[32px] sm:leading-[28px]">{t('home.cards.balancedHydration.percentage')}</p>
          </div>
          <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[12.83%_5.28%_58.02%_22.26%] lg:inset-[12.83%_5.28%_58.02%_22.26%] md:inset-[12.83%_5.28%_58.02%_22.26%] sm:inset-[12.83%_5.28%_58.02%_22.26%] justify-center leading-[26px] lg:leading-[38px] md:leading-[34px] sm:leading-[30px] text-[#00d1ff] text-[20px] lg:text-[32px] md:text-[28px] sm:text-[22px] text-right tracking-[-0.8px] lg:tracking-[-0.8px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-normal">
            <p className="mb-0">{t('home.cards.balancedHydration.title')}</p>
            <p className="font-['Montserrat',sans-serif] font-light">{t('home.cards.balancedHydration.subtitle')}</p>
          </div>
          <div className="absolute flex flex-col font-['Inter',sans-serif] font-medium inset-[53.94%_78.24%_39.07%_7.42%] lg:inset-[53.94%_78.24%_39.07%_7.42%] md:inset-[53.94%_78.24%_39.07%_7.42%] sm:inset-[53.94%_78.24%_39.07%_7.42%] italic justify-center leading-[0] text-[#00d1ff] text-[10px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center whitespace-nowrap">
            <p className="leading-[14px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px]">{t('home.cards.balancedHydration.source')}</p>
          </div>
        </div>

        {/* Side Image Right */}
        <div className="absolute h-[192px] lg:h-[300px] md:h-[280px] sm:h-[240px] left-[calc(50%+27.08%+224px)] lg:left-[1080px] md:left-[63.3%] sm:left-[55%] top-0 w-[173px] lg:w-[270px] md:w-[25%] sm:w-[40%]">
          <div className="absolute inset-0 rounded-[21px] lg:rounded-[32px] md:rounded-[30px] sm:rounded-[24px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[21px] lg:rounded-[32px] md:rounded-[30px] sm:rounded-[24px]">
              <img alt="Screenshot" className="absolute h-[101.64%] left-[-6.77%] max-w-none top-[-1.52%] w-[113.53%]" src={img6} />
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="absolute content-stretch flex flex-col gap-[22px] lg:gap-[28px] md:gap-[24px] sm:gap-[20px] items-start left-1/2 translate-x-[-50%] top-[3950px] lg:top-[3950px] md:top-[3500px] sm:top-[2800px] w-[784px] lg:w-[980px] md:w-[90%] sm:w-[95%]">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full mt-8 lg:mt-14 md:mt-8 sm:mt-6">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[48px] lg:text-[60px] md:text-[48px] sm:text-[32px] text-center tracking-[-0.8px] lg:tracking-[-0.8px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
              <p className="leading-[29px] lg:leading-[36px] md:leading-[32px] sm:leading-[28px]">{t('home.whyChooseUs.title')}</p>
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-start justify-center relative shrink-0 w-full">
          <div className="bg-[#00d1ff] h-[3px] lg:h-[4px] md:h-[5px] sm:h-[5px] rounded-[25px] lg:rounded-[25px] md:rounded-[30px] sm:rounded-[30px] shrink-0 w-[64px] lg:w-[80px] md:w-[90px] sm:w-[90px]" />
        </div>
      </div>

      {/* Why Choose Us Cards */}
      {/* Card 1: Rich in Minerals */}
      <div className="absolute h-[208px] lg:h-[260px] md:h-[240px] sm:h-[220px] left-1/2 translate-x-[-50%] top-[4200px] lg:top-[4200px] md:top-[3700px] sm:top-[3000px] w-[272px] lg:w-[340px] md:w-[45%] sm:w-[90%] z-[100]">
        <div className="absolute bg-white inset-[18.18%_0_0_-5%] rounded-[30px] lg:rounded-[37px]" />
        <div className="absolute aspect-[100/100] left-[34.13%] right-[34.93%] lg:left-[38%] lg:right-[38%] top-0">
          <div className="absolute inset-[9.48%_0_18.97%_34.91%] overflow-hidden">
            <div className="absolute inset-0">
              <img alt="PC Icon" className="block max-w-none size-full" src={img13} />
            </div>
          </div>
          <div className="absolute inset-[29.31%_16.81%_0_9.91%] overflow-hidden">
            <div className="absolute inset-0">
              <img alt="Glass" className="block max-w-none size-full" src={img14} />
            </div>
          </div>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[64%_13.33%_19%_13.6%] lg:inset-[64%_13.33%_19%_13.6%] md:inset-[64%_13.33%_19%_13.6%] sm:inset-[58%_13.33%_5%_13.6%] justify-center leading-[18px] lg:leading-[22px] md:leading-[20px] sm:leading-[14px] not-italic text-[#64748b] text-[12px] lg:text-[14px] md:text-[14px] sm:text-[11px] text-center z-[10]">
          <p className="mb-0">{t('home.whyChooseUs.richInMinerals.description')}</p>
          <p className="mb-0">{t('home.whyChooseUs.richInMinerals.descriptionLine1')}</p>
          <p className="mb-0">{t('home.whyChooseUs.richInMinerals.descriptionLine2')}</p>
        </div>
        <div className={`absolute flex flex-col font-['Montserrat',sans-serif] font-bold ${lang === 'ru' ? 'inset-[34%_12%_56%_12%] lg:inset-[38%_12%_52%_12%]' : 'inset-[38%_12%_52%_12%] lg:inset-[42%_12%_48%_12%]'} md:inset-[38%_12%_52%_12%] sm:inset-[36%_12%_54%_12%] justify-center leading-[0] text-[#0f172a] text-[13px] lg:text-[16px] md:text-[16px] sm:text-[13px] text-center uppercase whitespace-normal`}>
          <p className="leading-[18px] lg:leading-[22px] md:leading-[22px] sm:leading-[18px]">{t('home.whyChooseUs.richInMinerals.title')}</p>
        </div>
      </div>

      {/* Card 2: Non-Carbonated */}
      <div className="absolute h-[200px] lg:h-[250px] md:h-[240px] sm:h-[220px] left-1/2 translate-x-[-50%] lg:translate-x-[-700px] md:translate-x-[-50%] sm:translate-x-[-50%] top-[4580px] lg:top-[4580px] md:top-[4000px] sm:top-[3280px] w-[272px] lg:w-[340px] md:w-[45%] sm:w-[90%] z-[100]">
        <div className="absolute bg-white inset-[13.97%_0_0_0] rounded-[30px] lg:rounded-[37px]" />
        <div className="absolute aspect-[100/100] left-[37.07%] overflow-clip right-[32%] lg:left-[36%] lg:right-[36%] top-0">
          <div className="absolute inset-[10.22%_10.23%_61.04%_62.5%]">
            <div className="absolute inset-0">
              <img alt="Leaf" className="block max-w-none size-full" src={img7} />
            </div>
          </div>
          <div className="absolute inset-[16.22%_15.91%_6.5%_4.41%] overflow-hidden">
            <div className="absolute inset-0">
              <img alt="Glass" className="block max-w-none size-full" src={img8} />
            </div>
          </div>
          <div className="absolute inset-[32.96%_31.82%_25.5%_35.23%]">
            <img alt="Top" className="block max-w-none size-full" src={img9} />
          </div>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[63.5%_13.33%_22%_13.6%] lg:inset-[63.5%_13.33%_22%_13.6%] md:inset-[63.5%_13.33%_22%_13.6%] sm:inset-[57%_13.33%_7%_13.6%] justify-center leading-[14px] lg:leading-[18px] md:leading-[18px] sm:leading-[14px] not-italic text-[#64748b] text-[12px] lg:text-[14px] md:text-[14px] sm:text-[11px] text-center z-[10]">
          <p className="mb-0">{t('home.whyChooseUs.nonCarbonated.description')}</p>
          <p className="mb-0">{t('home.whyChooseUs.nonCarbonated.descriptionLine1')}</p>
          <p className="mb-0">{t('home.whyChooseUs.nonCarbonated.descriptionLine2')}</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[35%_12%_55%_12%] lg:inset-[39%_12%_51%_12%] md:inset-[35%_12%_55%_12%] sm:inset-[33%_12%_57%_12%] justify-center leading-[0] text-[#0f172a] text-[13px] lg:text-[16px] md:text-[16px] sm:text-[13px] text-center uppercase whitespace-normal">
          <p className="leading-[18px] lg:leading-[22px] md:leading-[22px] sm:leading-[18px]">{t('home.whyChooseUs.nonCarbonated.title')}</p>
        </div>
      </div>

      {/* Card 3: No Artificial Ingredients */}
      <div className="absolute h-[204px] lg:h-[255px] md:h-[240px] sm:h-[220px] left-1/2 translate-x-[-50%] lg:translate-x-[330px] md:translate-x-[-50%] sm:translate-x-[-50%] top-[4430px] lg:top-[4430px] md:top-[4300px] sm:top-[3560px] w-[272px] lg:w-[340px] md:w-[45%] sm:w-[90%] z-[100]">
        <div className="absolute bg-white inset-[15.83%_0_0_0] rounded-[30px] lg:rounded-[37px]" />
        <div className="absolute aspect-[100/100] left-[34.53%] right-[34.53%] lg:left-[38%] lg:right-[38%] top-0">
          <div className="absolute inset-[5.88%_0_26.15%_50.33%] overflow-hidden">
            <img alt="Group" className="block max-w-none size-full" src={img10} />
          </div>
          <div className="absolute inset-[13.93%_8.94%_9.09%_8.94%] overflow-hidden">
            <div className="absolute inset-0">
              <img alt="Glass" className="block max-w-none size-full" src={img11} />
            </div>
          </div>
          <div className="absolute inset-[39.77%_45.45%_20.45%_45.45%]">
            <img alt="Top" className="block max-w-none size-full" src={img12} />
          </div>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[63%_10.4%_20%_10.67%] lg:inset-[63%_10.4%_20%_10.67%] md:inset-[63%_10.4%_20%_10.67%] sm:inset-[57%_10.4%_8%_10.67%] justify-center leading-[18px] lg:leading-[22px] md:leading-[20px] sm:leading-[14px] not-italic text-[#64748b] text-[12px] lg:text-[14px] md:text-[14px] sm:text-[11px] text-center z-[10]">
          <p className="mb-0">{t('home.whyChooseUs.noArtificialIngredients.description')}</p>
          <p className="mb-0">{t('home.whyChooseUs.noArtificialIngredients.descriptionLine1')}</p>
          <p className="mb-0">{t('home.whyChooseUs.noArtificialIngredients.descriptionLine2')}</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[33%_5%_57%_5%] lg:inset-[37%_5%_53%_5%] md:inset-[33%_5%_57%_5%] sm:inset-[31%_5%_59%_5%] justify-center leading-[0] text-[#0f172a] text-[12px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center uppercase whitespace-nowrap overflow-hidden">
          <p className="leading-[16px] lg:leading-[20px] md:leading-[20px] sm:leading-[16px]">{t('home.whyChooseUs.noArtificialIngredients.title')}</p>
        </div>
      </div>

      {/* Trusted By Section */}
      
      <div className="absolute content-stretch flex flex-col h-[328px] lg:h-[410px] md:h-[380px] sm:h-[320px] items-start left-1/2 px-[136px] lg:px-[170px] md:px-[48px] sm:px-[24px] py-[56px] lg:py-[70px] md:py-[60px] sm:py-[40px] top-[5050px] lg:top-[5050px] md:top-[4500px] sm:top-[3950px] translate-x-[-50%] w-full max-w-[1920px]">
        <div className="h-[200px] lg:h-[250px] md:h-[240px] sm:h-[200px] max-w-[1536px] relative shrink-0 w-full">
          <div className="absolute content-stretch flex flex-col items-center left-[calc(50%+0.5px)] top-[-24px] lg:top-[-30px] md:top-[-28px] sm:top-[-24px] translate-x-[-50%] w-[784px] lg:w-[980px] md:w-[90%] sm:w-[95%]">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[48px] lg:text-[60px] md:text-[48px] sm:text-[32px] text-center uppercase whitespace-nowrap">
              <p className="leading-[21px] lg:leading-[26px] md:leading-[24px] sm:leading-[22px]">{t('home.trustedBy.title')}</p>
            </div>
          </div>
          <div className="absolute content-stretch flex items-start justify-center left-1/2 top-[50px] lg:top-[27px] md:top-[50px] sm:top-[110px] translate-x-[-50%] w-[980px] lg:w-[980px] md:w-[90%] sm:w-[95%]">
            <div className="bg-[#00d1ff] h-[4px] lg:h-[4px] md:h-[5px] sm:h-[5px] rounded-[25px] lg:rounded-[25px] md:rounded-[30px] sm:rounded-[30px] shrink-0 w-[80px] lg:w-[80px] md:w-[90px] sm:w-[90px]" />
          </div>
        
          <div className="absolute content-stretch flex flex-col items-center left-[calc(50%+1px)] top-[26px] lg:top-[38px] md:top-[30px] sm:top-[24px] translate-x-[-50%] w-[784px] lg:w-[980px] md:w-[90%] sm:w-[95%]">
            <div className="flex flex-col font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[12px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center whitespace-nowrap">
              <p className="leading-[14px] lg:leading-[16px] md:leading-[14px] sm:leading-[12px]">{t('home.trustedBy.subtitle')}</p>
            </div>
          </div>
          {/* Partner Logos - Show all 3 at once, active one is larger */}
          <div className="absolute content-stretch flex items-center justify-center gap-[40px] lg:gap-[50px] md:gap-[40px] sm:gap-[30px] left-[calc(50%+0.5px)] top-[68px] lg:top-[85px] md:top-[96px] sm:top-[96px] translate-x-[-50%] w-[784px] lg:w-[980px] md:w-[90%] sm:w-[95%] h-[104px] lg:h-[130px] md:h-[144px] sm:h-[144px]">
            {/* Logo 0 - sas20 logo */}
            <div 
              className={`relative shrink-0 transition-all duration-300 cursor-pointer ${
                trustedByIndex === 0 
                  ? 'h-[104px] w-[128px] lg:h-[130px] lg:w-[160px] scale-110' 
                  : 'h-[72px] w-[90px] lg:h-[90px] lg:w-[112px] opacity-70 hover:opacity-90'
              }`}
              onClick={() => setTrustedByIndex(0)}
            >
              <img 
                alt="Partner Logo" 
                className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" 
                src={imgSas20Logo1} 
              />
            </div>
            {/* Logo 1 - image6e */}
            <div 
              className={`relative shrink-0 transition-all duration-300 cursor-pointer ${
                trustedByIndex === 1 
                  ? 'h-[104px] w-[160px] lg:h-[130px] lg:w-[200px] scale-110' 
                  : 'h-[72px] w-[110px] lg:h-[90px] lg:w-[138px] opacity-70 hover:opacity-90'
              }`}
              onClick={() => setTrustedByIndex(1)}
            >
              <img 
                alt="Partner Logo" 
                className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" 
                src={img6Eb12990A37F43358E368Af827A9C8A5Png1} 
              />
            </div>
            {/* Logo 2 - logo 1 */}
            <div 
              className={`relative shrink-0 transition-all duration-300 cursor-pointer ${
                trustedByIndex === 2 
                  ? 'h-[104px] w-[176px] lg:h-[130px] lg:w-[220px] scale-110' 
                  : 'h-[72px] w-[123px] lg:h-[90px] lg:w-[154px] opacity-70 hover:opacity-90'
              }`}
              onClick={() => setTrustedByIndex(2)}
            >
              <img 
                alt="Partner Logo" 
                className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" 
                src={imgLogo1} 
              />
            </div>
          </div>
          {/* Pagination Dots */}
          <div className="absolute content-stretch flex h-[39px] lg:h-[49px] items-center justify-center left-[24px] pt-[26px] lg:pt-[32px] right-[24px] top-[162px] lg:top-[202px] z-[100]">
            <div className="flex items-center gap-[10px] lg:gap-[12px] relative shrink-0">
              <button
                type="button"
                onClick={() => setTrustedByIndex(0)}
                className={`rounded-[9999px] transition-all duration-300 ${
                  trustedByIndex === 0
                    ? 'bg-[#00d1ff] h-[8px] w-[19px] lg:h-[10px] lg:w-[24px]'
                    : 'bg-white size-[8px] lg:size-[10px] hover:bg-[#00d1ff]/50 cursor-pointer'
                }`}
                aria-label="Show first partner"
              />
              <button
                type="button"
                onClick={() => setTrustedByIndex(1)}
                className={`rounded-[9999px] transition-all duration-300 ${
                  trustedByIndex === 1
                    ? 'bg-[#00d1ff] h-[8px] w-[19px] lg:h-[10px] lg:w-[24px]'
                    : 'bg-white size-[8px] lg:size-[10px] hover:bg-[#00d1ff]/50 cursor-pointer'
                }`}
                aria-label="Show second partner"
              />
              <button
                type="button"
                onClick={() => setTrustedByIndex(2)}
                className={`rounded-[9999px] transition-all duration-300 ${
                  trustedByIndex === 2
                    ? 'bg-[#00d1ff] h-[8px] w-[19px] lg:h-[10px] lg:w-[24px]'
                    : 'bg-white size-[8px] lg:size-[10px] hover:bg-[#00d1ff]/50 cursor-pointer'
                }`}
                aria-label={t('home.trustedBy.showThirdPartner')}
              />
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="absolute content-stretch flex items-center justify-between left-[107px] right-[107px] lg:left-[134px] lg:right-[134px] top-[calc(50%+40px)] lg:top-[calc(50%+50.25px)] translate-y-[-50%] z-[100]">
            {/* Next Button - Left side (աջ տանի) */}
            <FeaturedProductsNavigationArrow
              direction="next"
              onClick={(e?: React.MouseEvent) => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                console.log('🖱️ [TRUSTED BY] Next button clicked');
                handleNextTrustedBy(e);
              }}
              className="size-[45px] lg:size-[56px] relative z-[101] left-0 right-auto border border-black border-solid shadow-none hover:shadow-none [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
              ariaLabel="Next partner"
            />

            {/* Previous Button - Right side (ձախ տանի) */}
            <FeaturedProductsNavigationArrow
              direction="prev"
              onClick={(e?: React.MouseEvent) => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                console.log('🖱️ [TRUSTED BY] Previous button clicked');
                handlePreviousTrustedBy(e);
              }}
              className="size-[45px] lg:size-[56px] relative z-[101] right-0 left-auto border border-black border-solid shadow-none hover:shadow-none [&_svg_path]:fill-black [&_svg_path]:hover:fill-[#00d1ff]"
              ariaLabel="Previous partner"
            />
          </div>
        </div>
      </div>

      <Footer router={router} t={t} isHomePage={true} />

      {/* Additional Decorative Elements - Hero Section Bubbles */}
      {/* Background ellipse at original left position */}
      <div className="absolute top-[38.44%] left-[-10%] h-[800px] w-[600px]  overflow-hidden pointer-events-none">
        <img alt="Background Ellipse" className="block max-w-none size-full" src={imgEllipse41} />
      </div>

      {/* Decorative bubbles — bulb.svg, float + drag */}
      <div className="absolute flex top-[43.44%] right-[71%] bottom-[43.57%] left-0 items-center justify-center overflow-hidden pointer-events-none">
        <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active-2 size-[385px] flex items-center justify-center" maxDrag={110} />
      </div>

      <div className="absolute flex items-center justify-center left-[1394px] top-[1190px] size-[300px] pointer-events-none">
        <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active-5 size-full flex items-center justify-center" maxDrag={95} />
      </div>

      <div className="absolute flex items-center justify-center left-[203px] top-[1433px] size-[100px] pointer-events-none">
        <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active-9 size-full flex items-center justify-center" maxDrag={65} />
      </div>

      <div className="absolute flex inset-[22%_0.5%_77.5%_76.61%] items-center justify-center pointer-events-none">
        <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active-6 size-[102px] flex items-center justify-center" maxDrag={65} />
      </div>

      <div className="absolute flex top-[44%] right-[1%] bottom-[50.88%] left-auto items-center justify-center overflow-visible pointer-events-none">
        <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active-8 size-[339px] flex items-center justify-center" maxDrag={110} />
      </div>

      <div className="absolute flex top-[52%] right-[1%] bottom-[35.23%] left-auto items-center justify-center overflow-hidden pointer-events-none">
        <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active-3 size-[228px] flex items-center justify-center" maxDrag={95} />
      </div>

      <div className="absolute flex top-[1%] right-[75.18%] bottom-[55.65%] left-[-9.5%] items-center justify-center overflow-hidden pointer-events-none">
        <DraggableBulb src={imgBulb} wrapperClassName="figma-float-active-0 size-[156px] flex items-center justify-center" maxDrag={80} />
      </div>

      {/* Water Energy Section Main Graphic */}
      <div className="absolute h-[543px] left-[calc(50%+31px)] top-[2500px] translate-x-[-50%] w-[731px]">
        <div className="absolute contents inset-0">
          <div className="absolute contents inset-[0_29.32%_0_22.98%]">
            <div className="absolute contents inset-[0_29.32%_0_22.98%]">
              <div className="absolute inset-[9.43%_29.32%_67.89%_59.08%]">
                <div className="absolute inset-[0_2.54%_3.14%_0.54%]">
                  <img alt="Vector" className="block max-w-none size-full" src={img15} />
                </div>
              </div>
              <div className="absolute inset-[48.32%_66.63%_31.94%_22.98%]">
                <div className="absolute inset-0">
                  <img alt="Vector" className="block max-w-none size-full" src={img16} />
                </div>
              </div>
              <div className="group/bottle absolute aspect-[244.35066986310085/678.8584334167344] flex items-center justify-center left-[33.81%] mix-blend-multiply right-[39.46%] top-0 overflow-visible">
                <div className="flex-none h-[541px] rotate-[-0.5deg] w-[191px] overflow-visible">
                  <div className="relative size-full flex items-center justify-center overflow-visible">
                    <div className="absolute inset-0 overflow-visible pointer-events-none flex items-center justify-center">
                      <img
                        alt="Water Bottle"
                        className="h-full w-auto max-h-full object-contain object-center scale-[2] transition-transform duration-500 ease-out group-hover/bottle:scale-[4] group-hover/bottle:rotate-90"
                        src={img17}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-[15.61%_32.71%_66.56%_53.61%] overflow-hidden">
                <div className="absolute inset-0">
                  <img alt="Glass" className="block max-w-none size-full" src={img18} />
                </div>
              </div>
              <div className="absolute inset-[54.8%_59.41%_27.38%_26.91%] overflow-hidden">
                <div className="absolute inset-0">
                  <img alt="Glass" className="block max-w-none size-full" src={img18} />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[65.4%_0_16.48%_57.22%] justify-center leading-[0] text-[#0f172a] text-[0px] tracking-[-0.9px] uppercase whitespace-nowrap">
            <p className="leading-[40px] mb-0 text-[53px]">{t('home.waterEnergySection.pure')}</p>
            <p className="leading-[40px] mb-0 text-[53px]">{t('home.waterEnergySection.energy')}</p>
            <p className="font-['Montserrat',sans-serif] font-normal leading-[16px] text-[13px]">{t('home.waterEnergySection.subtitle')}</p>
          </div>
          <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[29.76%_62.8%_62.88%_0] justify-center leading-[0] text-[#09c1ff] text-[53px] tracking-[-0.9px] uppercase whitespace-nowrap">
            <p className="leading-[40px]">{t('home.waterEnergySection.balance')}</p>
          </div>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-normal inset-[22.39%_62.8%_72.01%_7.99%] justify-center leading-[15px] text-[#0f172a] text-[13px] text-right tracking-[-0.9px] uppercase whitespace-nowrap">
          <p className="mb-0">{t('home.waterEnergySection.descriptionLine1')}</p>
          <p className="mb-0">{t('home.waterEnergySection.descriptionLine2')}</p>
        </div>
      </div>

      {/* Vector Graphics for Why Choose Us */}
      <div className="absolute left-1/2 top-[4150px] lg:top-[4215px] md:top-[3850px] sm:top-[3150px] -translate-x-1/2 w-[980px] lg:w-[980px] md:w-[90%] sm:w-[95%]">
        <div className="absolute flex h-[325px] items-center justify-center right-[40px] mix-blend-lighten top-[120px] w-[521.999px]">
          <div className="flex-none rotate-[180deg]">
            <div className="h-[285px] relative w-[521.999px]">
              <img alt="Vector" className="block max-w-none size-full" src={imgVector4} />
            </div>
          </div>
        </div>
        <div className="absolute flex h-[551.999px] items-center justify-center left-[20px] top-[80px] w-[325px]">
          <div className="flex-none rotate-[-90deg]">
            <div className="h-[285px] relative w-[521.999px]">
              <img alt="Vector" className="block max-w-none size-full" src={imgVector5} />
            </div>
          </div>
        </div>
        <div className="absolute flex h-[325px] items-center justify-center right-[35px] mix-blend-lighten top-[380px] w-[461px]">
          <div className="flex-none scale-y-[-100%]">
            <div className="h-[285px] relative w-[461px]">
              <img alt="Vector" className="block max-w-none size-full" src={imgVector6} />
            </div>
          </div>
        </div>
        <div className="absolute flex h-[325px] items-center justify-center left-[0px] mix-blend-lighten top-[380px] w-[526px]">
          <div className="flex-none rotate-[180deg]">
            <div className="h-[285px] relative w-[526px]">
              <img alt="Vector" className="block max-w-none size-full" src={imgVector7} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-1/2 top-[4820px] translate-x-[-50%] w-[70px] h-[88px] z-[12]">
        <img alt="Vector" className="block max-w-none size-full" src={imgVector}  />
      </div>


      {/* Search Modal */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 bg-[#62b3e8]/30 backdrop-blur-sm z-[100] flex items-start justify-center pt-16 md:pt-20 px-4"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            ref={searchModalRef}
            className="w-full max-w-2xl animate-in fade-in slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="relative">
              {/* Search Input with glassy effect */}
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.search.placeholder')}
                  className="w-full h-12 md:h-14 pl-12 md:pl-14 pr-4 bg-[#62b3e8]/80 backdrop-blur-md border-2 border-white/90 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white text-base md:text-lg placeholder:text-white/70 text-white shadow-lg"
                />
                {/* Search Icon inside input */}
                <div className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
