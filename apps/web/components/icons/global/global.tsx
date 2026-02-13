'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getStoredLanguage, setStoredLanguage, LANGUAGES, type LanguageCode } from '../../../lib/language';
import { apiClient } from '../../../lib/api-client';
import { type CurrencyCode, CURRENCIES, getStoredCurrency, setStoredCurrency } from '../../../lib/currency';
import { SearchIcon } from '../SearchIcon';
import { HeaderCartIcon } from '../HeaderCartIcon';
import { LanguageIcon } from '../LanguageIcon';
import { ExitIcon } from '../ExitIcon';

// Export HeaderCartIcon for use in other components
export { HeaderCartIcon };

/**
 * Reusable Add to Cart utility function
 * Can be used in home page and single product page
 */
export interface AddToCartProduct {
  id: string;
  slug: string;
  inStock?: boolean;
}

export interface AddToCartOptions {
  product: AddToCartProduct;
  variantId?: string;
  quantity?: number;
  isLoggedIn: boolean;
  router: ReturnType<typeof useRouter>;
  t?: (key: string) => string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export async function addToCart({
  product,
  variantId,
  quantity = 1,
  isLoggedIn,
  router,
  t = (key: string) => key,
  onSuccess,
  onError,
}: AddToCartOptions): Promise<boolean> {
  if (!product.inStock) {
    return false;
  }

  // If user is not logged in, handle guest cart or redirect to login
  if (!isLoggedIn) {
    try {
      // Try guest cart first
      const stored = localStorage.getItem('shop_cart_guest');
      const cart = stored ? JSON.parse(stored) : [];
      
      // If we have variantId, use it, otherwise get from product details
      let finalVariantId = variantId;
      
      if (!finalVariantId) {
        // Get product details to get variant ID
        interface ProductDetails {
          id: string;
          slug: string;
          variants?: Array<{
            id: string;
            sku: string;
            price: number;
            stock: number;
            available: boolean;
          }>;
        }

        const encodedSlug = encodeURIComponent(product.slug.trim());
        const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);

        if (!productDetails.variants || productDetails.variants.length === 0) {
          if (onError) onError(new Error('No variants available'));
          return false;
        }

        finalVariantId = productDetails.variants[0].id;
      }

      const existing = cart.find((i: any) => i.variantId === finalVariantId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({
          productId: product.id,
          productSlug: product.slug,
          variantId: finalVariantId,
          quantity,
        });
      }
      localStorage.setItem('shop_cart_guest', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      // If guest cart fails, redirect to login
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }
  }

  // Logged in user - use API
  try {
    let finalVariantId = variantId;

    // If no variantId provided, get from product details
    if (!finalVariantId) {
      interface ProductDetails {
        id: string;
        slug: string;
        variants?: Array<{
          id: string;
          sku: string;
          price: number;
          stock: number;
          available: boolean;
        }>;
      }

      const encodedSlug = encodeURIComponent(product.slug.trim());
      const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);

      if (!productDetails.variants || productDetails.variants.length === 0) {
        if (onError) onError(new Error(t('home.errors.noVariantsAvailable')));
        return false;
      }

      finalVariantId = productDetails.variants[0].id;
    }

    await apiClient.post('/api/v1/cart/items', {
      productId: product.id,
      variantId: finalVariantId,
      quantity,
    });

    // Trigger cart update event
    window.dispatchEvent(new Event('cart-updated'));
    if (onSuccess) onSuccess();
    return true;
  } catch (error: any) {
    console.error('❌ [ADD TO CART] Error:', error);

    // Check if error is about product not found
    if (error?.message?.includes('does not exist') || error?.message?.includes('404') || error?.status === 404) {
      if (onError) onError(new Error(t('home.errors.productNotFound')));
      return false;
    }

    // Check if error is about insufficient stock
    if (
      error.response?.data?.detail?.includes('No more stock available') ||
      error.response?.data?.detail?.includes('exceeds available stock') ||
      error.response?.data?.title === 'Insufficient stock'
    ) {
      if (onError) onError(new Error(t('home.errors.noMoreStockAvailable')));
      return false;
    }

    // If error is about authorization, redirect to login
    if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error?.status === 401) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }

    if (onError) onError(error);
    return false;
  }
}

// Local image paths - main logo + footer/background wave
const imgBorborAguaLogoColorB2024Colored1 = "/assets/home/imgBorborAguaLogoColorB2024Colored1.png";
// Footer/background wave PNG from Figma, saved locally in public/assets/home
const imgDanielSinocaAancLsb0SU0Unsplash1 = "/assets/home/imgDanielWave.png";
const imgIcon2 = "/assets/home/imgIcon2.svg";
const imgSvg = "/assets/home/imgSvg.svg";
const imgSvg1 = "/assets/home/imgSvg1.svg";
const imgGroup = "/assets/home/imgGroup.svg";
const imgLink = "/assets/home/imgLink.svg";
const imgGroup2122 = "/assets/home/imgGroup2122.svg";
const imgGroup2121 = "/assets/home/imgGroup2121.svg";
const imgGroup2124 = "/assets/home/imgGroup2124.svg";
const imgGroup2123 = "/assets/home/imgGroup2123.svg";
const img4 = "/assets/home/img4.svg";
// Currency dropdown arrow from Figma (node-id: 92:731)
const imgCurrencyArrow = "http://localhost:3845/assets/1df18b1c925444bdbdca1d804466e1927b561a35.svg";

interface HeaderProps {
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
  setShowSearchModal: (show: boolean) => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  setShowUserMenu: (show: boolean) => void;
  showUserMenu: boolean;
  handleLogout: () => void;
  userMenuRef: React.RefObject<HTMLDivElement>;
  isHomePage?: boolean;
}

export function Header({
  router,
  t,
  setShowSearchModal,
  isLoggedIn,
  isAdmin,
  setShowUserMenu,
  showUserMenu,
  handleLogout,
  userMenuRef,
  isHomePage = false,
}: HeaderProps) {
  // Cart count state
  const [cartCount, setCartCount] = useState<number>(0);
  // Language and currency state
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [currency, setCurrency] = useState<CurrencyCode>('AMD');
  const [showLangCurrencyMenu, setShowLangCurrencyMenu] = useState(false);
  const langCurrencyMenuRef = useRef<HTMLDivElement | null>(null);
  const imgLanguageIcon = "/assets/home/Vector.svg";

  // Fetch cart count
  useEffect(() => {
    async function fetchCartCount() {
      try {
        if (isLoggedIn) {
          // If user is logged in, fetch from API
          const response = await apiClient.get<{ cart: { itemsCount?: number; items?: Array<{ quantity: number }> } }>('/api/v1/cart');
          const itemsCount = response.cart.itemsCount || response.cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          setCartCount(itemsCount);
        } else {
          // If guest, load from localStorage
          if (typeof window === 'undefined') {
            setCartCount(0);
            return;
          }

          const CART_KEY = 'shop_cart_guest';
          const stored = localStorage.getItem(CART_KEY);
          if (!stored) {
            setCartCount(0);
            return;
          }

          const guestCart: Array<{ quantity: number }> = JSON.parse(stored);
          const count = guestCart.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(count);
        }
      } catch (error) {
        console.error('Error fetching cart count:', error);
        setCartCount(0);
      }
    }

    fetchCartCount();

    // Listen to cart-updated event
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('auth-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('auth-updated', handleCartUpdate);
    };
  }, [isLoggedIn]);

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

  // Close menu when clicking outside
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

  const handleLanguageChange = (code: LanguageCode) => {
    if (code === language) {
      setShowLangCurrencyMenu(false);
      return;
    }
    setLanguage(code);
    setStoredLanguage(code, { skipReload: false });
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

  // Header positioned on top of white spacer section
  const topPosition = isHomePage 
    ? 'top-[4px] md:top-[40px] sm:top-[4px]'
    : 'top-[80px] md:top-[40px] sm:top-[60px]';
  
  // Add shadow when on white background (non-home pages), keep current shadow for home page
  const shadowClass = isHomePage 
    ? 'shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_60px_rgba(98,179,232,0.15)]'
    : 'shadow-[0_4px_20px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1)]';
  
  // Change background color when on white background to make it more visible but not too different
  const bgClass = isHomePage 
    ? 'bg-[rgba(255,255,255,0.32)]'
    : 'bg-[rgba(255,255,255,0.32)]';
  
  // Change border color when on white background to make it more visible
  const borderClass = isHomePage 
    ? 'border-[rgba(255,255,255,0.15)]'
    : 'border-gray-200/60';
  
  return (
    <>
      {/* Header Section - Navigation Bar */}
      <div className={`fixed ${bgClass} backdrop-blur-[15px] content-stretch flex flex-col h-[66px] md:h-[60px] sm:h-[52px] items-center justify-center left-1/2 px-[28px] md:px-[22px] sm:px-[14px] rounded-[64px] md:rounded-[56px] sm:rounded-[40px] ${topPosition} translate-x-[-50%] w-[1200px] xl:w-[1200px] lg:w-[1100px] md:w-[90%] sm:w-[95%] z-[150] border ${borderClass} ${shadowClass}`}>
        <div className="content-stretch flex gap-[110px] lg:gap-[100px] md:gap-[70px] sm:gap-[16px] h-[42px] md:h-[38px] sm:h-[34px] items-center justify-center relative shrink-0">
          {/* Logo */}
          <div
            onClick={() => router.push('/')}
            className="h-[31px] md:h-[26px] sm:h-[22px] relative shrink-0 w-[101px] md:w-[85px] sm:w-[72px] cursor-pointer"
          >
            <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgBorborAguaLogoColorB2024Colored1} />
          </div>

          {/* Navigation Menu */}
          <div className={`content-stretch flex font-['Inter:Bold',sans-serif] font-bold gap-[60px] lg:gap-[60px] md:gap-[24px] sm:gap-[12px] items-end justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-[#151e21] uppercase whitespace-nowrap sm:hidden md:flex`}>
            <div
              onClick={() => router.push('/')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">{t('home.navigation.home')}</p>
            </div>
            <div
              onClick={() => router.push('/products')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">{t('home.navigation.shop')}</p>
            </div>
            <div
              onClick={() => router.push('/about')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">{t('home.navigation.aboutUs')}</p>
            </div>
            <div
              onClick={() => router.push('/blog')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">{t('home.navigation.blog')}</p>
            </div>
            <div
              onClick={() => router.push('/contact')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">{t('home.navigation.contactUs')}</p>
            </div>
          </div>

          {/* Header Icons - Separate Vector Groups */}
          <div className="content-stretch flex gap-[20px] lg:gap-[18px] md:gap-[16px] sm:gap-[10px] items-center justify-center relative shrink-0 ml-[20px] md:ml-[16px] sm:ml-[12px]">
            {/* Language & Currency Selector */}
            <div className="relative" ref={langCurrencyMenuRef}>
              <button
                onClick={() => setShowLangCurrencyMenu(!showLangCurrencyMenu)}
                className="bg-[#1ac0fd] rounded-[70px] flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:bg-[#6bb8dc] active:scale-95"
                aria-expanded={showLangCurrencyMenu}
              >
                {/* Globe Icon */}
                <img 
                  src={imgLanguageIcon} 
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

            {/* Search Icon */}
            <div
              onClick={() => setShowSearchModal(true)}
              className="h-[21px] md:h-[18px] sm:h-[16px] w-[21px] md:w-[18px] sm:w-[16px] relative shrink-0 cursor-pointer flex items-center justify-center"
            >
              <SearchIcon size={21} className="brightness-0" />
            </div>

            {/* Cart Icon */}
            <div
              onClick={() => router.push('/cart')}
              className="h-[20px] md:h-[18px] sm:h-[16px] w-[20px] md:w-[18px] sm:w-[16px] relative shrink-0 cursor-pointer flex items-center justify-center"
            >
              <HeaderCartIcon size={20} className="brightness-0" />
              {/* Cart Count Badge */}
              {cartCount > 0 && (
                <span className="absolute -top-5 -right-4 bg-[#00d1ff] text-white text-[10px] font-bold rounded-full min-w-[16px] h-5 px-1.5 flex items-center justify-center border-2 border-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>

            {/* Exit/Logout Icon with User Menu */}
            {isLoggedIn ? (
              <div className="relative shrink-0" ref={userMenuRef}>
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-[26px] md:h-[24px] sm:h-[20px] w-[26px] md:w-[22px] sm:w-[20px] relative cursor-pointer flex items-center justify-center"
                >
                  <ExitIcon size={26} className="brightness-0" />
                </div>
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => {
                        router.push('/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150"
                    >
                      {t('common.navigation.profile')}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          router.push('/admin');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150"
                      >
                        {t('common.navigation.adminPanel')}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-150"
                    >
                      {t('common.navigation.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => router.push('/login')}
                className="h-[26px] md:h-[24px] sm:h-[20px] w-[26px] md:w-[22px] sm:w-[20px] relative shrink-0 cursor-pointer flex items-center justify-center"
              >
                <ExitIcon size={26} className="brightness-0" />
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

interface FooterProps {
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
  isHomePage?: boolean;
}

export function Footer({ router, t, isHomePage = false }: FooterProps) {
  return (
    <>
      {/* Footer */}
      <div className={`relative h-[620px] lg:h-[620px] md:h-[600px] sm:h-[500px] left-0 w-full ${isHomePage ? 'overflow-hidden mt-[5550px] lg:mt-[5550px] md:mt-[5000px] sm:mt-[4000px]' : 'overflow-visible'}`}>
        {/* Footer transition gradient - seamless blend with page background (only for non-home pages) */}
        {!isHomePage && (
          <div className="absolute top-0 left-0 right-0 h-[250px] z-[1]"/>
        )}
        {/* Footer Background Image - daniel sinoca */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img 
            alt="Footer Background" 
            className="absolute h-[144.5%] left-0 max-w-none top-[-44.62%] w-full" 
            src={imgDanielSinocaAancLsb0SU0Unsplash1}
            onError={(e) => {
              console.error('❌ [FOOTER] Failed to load Daniel Sinoca image:', imgDanielSinocaAancLsb0SU0Unsplash1);
            }}
            onLoad={() => {
              console.log('✅ [FOOTER] Daniel Sinoca image loaded:', imgDanielSinocaAancLsb0SU0Unsplash1);
            }}
          />
        </div>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0" />
        <div className="absolute h-[400px] lg:h-[400px] md:h-[400px] sm:h-[350px] left-[calc(50%+0.5px)] top-[200px] lg:top-[200px] md:top-[180px] sm:top-[120px] translate-x-[-50%] w-[1080px] lg:w-[1080px] md:w-[90%] sm:w-[95%] relative z-10 px-[20px] lg:px-[20px] md:px-[40px] sm:px-[20px]">
          <div className="absolute content-stretch flex gap-[100px] lg:gap-[100px] md:gap-[80px] sm:gap-[50px] items-start justify-start left-[calc(50%-16px)] top-0 translate-x-[-50%] flex-col md:flex-row sm:flex-col">
            {/* Column 1: Logo + Description */}
            <div className="flex flex-col h-[280px] lg:h-[280px] md:h-[280px] sm:h-auto relative shrink-0 w-[300px] lg:w-[300px] md:w-[45%] sm:w-full gap-[12px] lg:gap-[12px] md:gap-[14px] sm:gap-[14px]">
              <div className="content-stretch flex h-[14px] items-center left-0 top-0 w-[300px] lg:w-[300px] md:w-full sm:w-full">
                <div className="h-[30px] lg:h-[30px] md:h-[30px] sm:h-[26px] relative shrink-0 w-[100px] lg:w-[100px] md:w-[95px] sm:w-[80px]">
                  <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgBorborAguaLogoColorB2024Colored1} />
                </div>
              </div>
              <div className="content-stretch flex flex-row flex-wrap items-start left-0 w-[300px] lg:w-[300px] md:w-full sm:w-full">
                <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white w-full">
                  <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] break-words">
                    {t('home.footer.description')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-[9px] lg:gap-[9px] md:gap-[8px] sm:gap-[6px] left-0 relative cursor-pointer" onClick={() => router.push('/about')}>
                <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] whitespace-nowrap">
                  <p className="leading-[22px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px]">{t('home.footer.more')}</p>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0">
                  <div className="flex items-center justify-center relative shrink-0">
                    <div className="flex-none scale-y-[-100%]">
                      <div className="h-[28px] relative w-[24.02px]">
                        <img alt="Icon" className="block max-w-none size-full" src={imgIcon2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2-4: Site Map, Policies, Contact */}
            <div className="content-stretch flex gap-[185px] lg:gap-[185px] md:gap-[80px] sm:gap-[40px] items-start relative shrink-0 flex-col md:flex-row sm:flex-col">
              {/* Column 2: Site Map */}
              <div className="content-stretch flex flex-col gap-[20px] lg:gap-[20px] md:gap-[20px] sm:gap-[16px] items-start relative shrink-0 w-[94px] lg:w-[94px] md:w-[45%] sm:w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white tracking-[1.3px] lg:tracking-[1.3px] md:tracking-[1.2px] sm:tracking-[1px] uppercase w-full">
                    <p className="leading-[18px] lg:leading-[18px] md:leading-[18px] sm:leading-[16px] whitespace-pre-wrap">{t('home.footer.siteMap.title')}</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-row flex-wrap gap-[16px] lg:gap-[16px] md:gap-[14px] sm:gap-[12px] items-start relative shrink-0 w-full">
                  <div
                    onClick={() => router.push('/about')}
                    className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] break-words">{t('home.footer.siteMap.aboutUs')}</p>
                  </div>
                  <div
                    onClick={() => router.push('/contact')}
                    className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] break-words">{t('home.footer.siteMap.contact')}</p>
                  </div>
                  <div
                    onClick={() => router.push('/products')}
                    className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] break-words">{t('home.footer.siteMap.shop')}</p>
                  </div>
                </div>
              </div>

              {/* Column 3: Policies */}
              <div className="content-stretch flex flex-col gap-[20px] lg:gap-[20px] md:gap-[20px] sm:gap-[16px] items-start relative shrink-0 w-[140px] lg:w-[140px] md:w-[45%] sm:w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white tracking-[1.4px] lg:tracking-[1.4px] md:tracking-[1.4px] sm:tracking-[1.2px] uppercase w-full">
                    <p className="leading-[18px] lg:leading-[18px] md:leading-[18px] sm:leading-[16px] whitespace-pre-wrap">{t('home.footer.policies.title')}</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-row flex-wrap gap-[16px] lg:gap-[16px] md:gap-[14px] sm:gap-[12px] items-start relative shrink-0 w-full">
                  <div
                    onClick={() => router.push('/privacy')}
                    className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] break-words">{t('home.footer.policies.privacyPolicy')}</p>
                  </div>
                  <div
                    onClick={() => router.push('/terms')}
                    className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] break-words">{t('home.footer.policies.termsConditions')}</p>
                  </div>
                  <div
                    onClick={() => router.push('/delivery-terms')}
                    className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] break-words">{t('home.footer.policies.deliveryTerms')}</p>
                  </div>
                  <div
                    onClick={() => router.push('/refund-policy')}
                    className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] break-words">{t('home.footer.policies.refundPolicy')}</p>
                  </div>
                </div>
              </div>

              {/* Column 4: Contact */}
              <div className="content-stretch flex flex-col gap-[20px] lg:gap-[20px] md:gap-[20px] sm:gap-[16px] items-start relative shrink-0 w-[215px] lg:w-[215px] md:w-[45%] sm:w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[21px] lg:text-[21px] md:text-[20px] sm:text-[18px] text-white tracking-[1.6px] lg:tracking-[1.6px] md:tracking-[1.5px] sm:tracking-[1.2px] uppercase w-full">
                    <p className="leading-[18px] lg:leading-[18px] md:leading-[18px] sm:leading-[16px] whitespace-pre-wrap">{t('home.footer.contact.title')}</p>
                </div>
                </div>
                <div className="content-stretch flex flex-row flex-wrap gap-[14px] lg:gap-[14px] md:gap-[12px] sm:gap-[10px] items-start relative shrink-0 w-[215px] lg:w-[215px] md:w-full sm:w-full">
                  <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words">
                    <p className="font-['Inter',sans-serif] font-normal mb-0">
                      <span className="leading-[24px]">{t('home.footer.contact.office')} </span>
                      <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[24px] underline" href="tel:0037433000401">
                        <span className="[text-decoration-skip-ink:none] decoration-solid leading-[24px]">+374 33 000401</span>
                      </a>
                    </p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words">
                    <p className="font-['Inter',sans-serif] font-normal">
                      <span className="leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px]">{t('home.footer.contact.delivery')} </span>
                      <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px] underline" href="tel:0037441012004">
                        <span className="[text-decoration-skip-ink:none] decoration-solid leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px]">+374 41 012004</span>
                      </a>
                    </p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words">
                    <p className="font-['Inter',sans-serif] font-normal">
                      <span className="leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px]">{t('home.footer.contact.email')} </span>
                      <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px] underline" href="mailto:borboraqua.am@gmail.com">
                        <span className="[text-decoration-skip-ink:none] decoration-solid leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px]">info@borboraqua.am</span>
                      </a>
                    </p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words">
                    <p className="mb-0">{t('home.footer.contact.location')} {t('home.footer.contact.locationLine1')}</p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] not-italic relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white break-words">
                    <p className="mb-0">{t('home.footer.contact.locationLine2')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Icons */}
          <div className="absolute content-stretch flex gap-[14px] lg:gap-[14px] md:gap-[16px] sm:gap-[16px] h-[44px] lg:h-[44px] md:h-[48px] sm:h-[48px] items-center left-[-90px] lg:left-[-90px] md:left-[-120px] sm:left-[-150px] pt-[7px] lg:pt-[7px] md:pt-[8px] sm:pt-[8px] top-[295px] lg:top-[295px] md:top-[332px] sm:top-[332px] w-[300px] lg:w-[300px] md:w-[336px] sm:w-[336px]">
            <div className="border border-solid border-white content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[36px] lg:size-[36px] md:size-[40px] sm:size-[40px]">
              <div className="relative shrink-0 size-[18px] lg:size-[18px] md:size-[20px] sm:size-[20px]">
                <img alt="Social" className="block max-w-none size-full" src={imgSvg} onClick={() => window.open('https://www.instagram.com/borbor_aqua/', '_blank')} />
              </div>
            </div>
            <div className="border border-solid border-white content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[36px] lg:size-[36px] md:size-[40px] sm:size-[40px]">
              <div className="relative shrink-0 size-[18px] lg:size-[18px] md:size-[20px] sm:size-[20px]">
                <img alt="Social" className="block max-w-none size-full" src={imgSvg1} onClick={() => window.open('https://www.facebook.com/borbor.aqua', '_blank')} />
              </div>
            </div>
            <div className="border border-solid border-white content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[36px] lg:size-[36px] md:size-[40px] sm:size-[40px]">
              <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
                <div className="col-1 ml-0 mt-0 relative row-1 size-[16px] lg:size-[16px] md:size-[18px] sm:size-[18px] overflow-hidden">
                  <div className="absolute inset-0">
                    <img alt="Social" className="block max-w-none size-full" src={imgGroup} />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative shrink-0 size-[36px] lg:size-[36px] md:size-[40px] sm:size-[40px]">
              <img alt="Social" className="block max-w-none size-full" src={imgLink}   />
            </div>
          </div>
        </div>

        {/* Copyright & Payment Icons - Full width border on desktop */}
        <div className="absolute border-[#e2e8f0] border-solid border-t left-[calc(50%-25px)] top-[550px] lg:top-[550px] md:top-[520px] sm:top-[480px] translate-x-[-50%] w-[1200px] lg:w-[1200px] md:w-[90%] sm:w-[95%] z-10">
          <div className="max-w-[1200px] lg:max-w-[1200px] mx-auto px-[20px] lg:px-[20px] md:px-[50px] sm:px-[30px] pt-[36px] lg:pt-[36px] md:pt-[32px] sm:pt-[24px] content-stretch flex items-center justify-between flex-col sm:flex-col md:flex-row">
            <div className="relative shrink-0">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center relative">
                <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] lg:text-[12px] md:text-[11px] sm:text-[10px] text-white whitespace-nowrap">
                  <p className="leading-[16px] lg:leading-[16px] md:leading-[14px] sm:leading-[12px]">{t('home.footer.copyright')}</p>
                </div>
              </div>
            </div>
            <div className="relative shrink-0">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[13px] items-center justify-end relative">
                <div className="h-[24.998px] relative shrink-0 w-[77.198px]">
                  <img alt="Payment" className="block max-w-none size-full" src={imgGroup2122} />
                </div>
                <div className="h-[29.209px] relative shrink-0 w-[48.946px]">
                  <img alt="Payment" className="block max-w-none size-full" src={imgGroup2121} />
                </div>
                <div className="h-[25.209px] relative shrink-0 w-[98.706px]">
                  <img alt="Payment" className="block max-w-none size-full" src={imgGroup2124} />
                </div>
                <div className="h-[25px] relative shrink-0 w-[87.735px]">
                  <img alt="Payment" className="block max-w-none size-full" src={imgGroup2123} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface ButtonProps {
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
}

export function Button({ router, t }: ButtonProps) {
  return (
    <>
      {/* Buttons */}
      <div className="content-center flex flex-wrap gap-[0px_14px] lg:gap-[0px_14px] md:gap-[0px_12px] sm:gap-[0px_8px] h-[68px] lg:h-[68px] md:h-[64px] sm:h-[56px] items-center justify-center pt-[14px] lg:pt-[14px] md:pt-[12px] sm:pt-[8px] relative shrink-0 w-full">
        <div
          onClick={() => router.push('/products')}
          className="bg-[#1ac0fd] content-stretch flex flex-col h-[54px] lg:h-[54px] md:h-[52px] sm:h-[44px] items-center justify-center pl-[54px] pr-[52px] lg:pl-[54px] lg:pr-[52px] md:pl-[48px] md:pr-[46px] sm:pl-[32px] sm:pr-[30px] py-[14px] lg:py-[14px] md:py-[12px] sm:py-[10px] relative rounded-[9999px] shrink-0 w-[165px] lg:w-[165px] md:w-[160px] sm:w-[140px] cursor-pointer hover:bg-[#00b8e6] transition-colors"
        >
          <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-white whitespace-nowrap">
            <p className="leading-[22px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px]">{t('home.hero.shopNow')}</p>
          </div>
        </div>
        <div
          onClick={() => router.push('/about')}
          className="bg-[rgba(0,0,0,0)] border border-white/30 content-stretch flex flex-col h-[54px] lg:h-[54px] md:h-[52px] sm:h-[44px] items-center justify-center px-[36px] lg:px-[36px] md:px-[32px] sm:px-[24px] py-[14px] lg:py-[14px] md:py-[12px] sm:py-[10px] relative rounded-[9999px] shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[17px] lg:h-[17px] md:h-[17px] sm:h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-white">
            <p className="leading-[22px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px] whitespace-nowrap">{t('home.hero.learnMore')}</p>
          </div>
        </div>
      </div>
    </>
  );
}

interface ArrowIconProps {
  className?: string;
}

export function ArrowIcon({ className = "block max-w-none size-full" }: ArrowIconProps) {
  return (
    <img alt="Arrow" className={className} src={img4} />
  );
}

interface ViewAllProductsButtonProps {
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
  isMobile?: boolean;
}

export function ViewAllProductsButton({ router, t, isMobile = false }: ViewAllProductsButtonProps) {
  if (isMobile) {
    return (
      <>
        {/* Mobile View All Products Button */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center left-[calc(50%+1.5px)] top-[1400px] w-[241px]">
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
                      <ArrowIcon />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* View All Products Button */}
      <div className="absolute content-stretch flex flex-col items-center left-[20px] lg:left-[20px] md:left-[16px] sm:left-[12px] right-[20px] lg:right-[20px] md:right-[16px] sm:right-[12px] top-[680px] lg:top-[680px] md:top-[480px] sm:top-[430px]">
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
                    <ArrowIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Featured Product Card Interface
export interface FeaturedProduct {
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

interface FeaturedProductCardProps {
  product: FeaturedProduct;
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
  isLoggedIn: boolean;
  isAddingToCart: boolean;
  onAddToCart: (product: FeaturedProduct) => void | Promise<void>;
  onProductClick: (product: FeaturedProduct) => void;
  formatPrice: (price: number, currency?: CurrencyCode) => string;
  currency?: CurrencyCode;
  isMobile?: boolean;
  compact?: boolean; // For shop page - smaller cards
}

/**
 * Reusable Featured Product Card Component
 * Used on home page and can be used on any other page
 * Maintains the same UI and functionality as home page product cards
 */
export function FeaturedProductCard({
  product,
  router,
  t,
  isLoggedIn,
  isAddingToCart,
  onAddToCart,
  onProductClick,
  formatPrice,
  currency,
  isMobile = false,
  compact = false,
}: FeaturedProductCardProps) {
  if (isMobile) {
    // Extract volume from title or subtitle (e.g., "0.5L", "0.33L", "0.25L")
    const extractVolume = (product: FeaturedProduct): string | null => {
      const title = product.title || '';
      const subtitle = product.subtitle || '';
      const combined = `${title} ${subtitle}`;
      const volumeMatch = combined.match(/(\d+\.?\d*)\s*[Ll]/);
      return volumeMatch ? `${volumeMatch[1]}L` : null;
    };

    const volume = extractVolume(product);

    return (
      <div
        className="h-[293px] relative w-[187px] cursor-pointer overflow-visible"
        onClick={() => onProductClick(product)}
      >
        {/* Product Image */}
        <div className="absolute aspect-[305/854] left-[29%] right-[32%] top-0 overflow-visible">
          <div className="absolute inset-0 overflow-visible pointer-events-none">
            <img
              alt={product.title}
              className="absolute h-[110.66%] left-[-104.92%] max-w-none top-[-5.74%] w-[309.84%] object-contain"
              src={product.image || ''}
            />
          </div>
        </div>

        {/* Rounded Card with Price, Volume, and Add Button */}
        <div className="absolute bg-[rgba(123,201,236,0.2)] inset-[59.39%_0_21.5%_0] rounded-[9999px]">
          {/* Price */}
          <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] left-[15px] not-italic text-[16px] text-white top-[22px] whitespace-nowrap">
            <p className="leading-[28px]">{formatPrice(product.price, currency)}</p>
          </div>
          {/* Volume */}
          {volume && (
            <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-[15px] not-italic text-[#9f9f9f] text-[12px] top-[41px] tracking-[1.2px] uppercase whitespace-nowrap">
              <p className="leading-[16px]">{volume}</p>
            </div>
          )}
          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={isAddingToCart || !product.inStock}
            className="absolute block cursor-pointer left-[120px] size-[45px] top-[5px] bg-[#1ac0fd] hover:bg-[#6bb8dc] rounded-full flex items-center justify-center transition-all disabled:opacity-50"
            aria-label={t('home.featuredProducts.addToCart')}
          >
            <div className="flex flex-col font-['Hiragino_Maru_Gothic_ProN:W4',sans-serif] justify-center leading-[0] not-italic text-[30px] text-center text-white -mt-[2px]">
              <p className="leading-[24px] whitespace-pre-wrap">+</p>
            </div>
          </button>
        </div>

        {/* Product Title */}
        <div className="absolute flex flex-col font-['Montserrat:Bold',sans-serif] font-bold inset-[84.64%_3.21%_0_3.21%] justify-center leading-[0] text-[16px] text-center text-white">
          <p className="leading-[25px] whitespace-pre-wrap">{product.title}</p>
        </div>
      </div>
    );
  }

  // Desktop version
  if (compact) {
    // Compact version for shop page - smaller cards
    return (
      <div
        key={product.id}
        onClick={() => onProductClick(product)}
        className="flex flex-col items-center gap-[12px] w-full cursor-pointer product-card-hover product-card-compact  z-[11] isolate rounded-[45px] p-2"
      >
        {/* Image Container - Smaller for shop */}
        <div className="h-[200px] w-full relative product-image-container flex items-center justify-center bg-transparent rounded-lg">
          {product.image ? (
            <img
              alt={product.title}
              className="h-full w-full object-contain product-image-hover"
              src={product.image}
              style={{ backgroundColor: 'transparent' }}
            />
          ) : (
            <div className="w-full h-full bg-gray-300 rounded-lg" />
          )}
        </div>
        {/* Content Section - Compact layout */}
        <div className="w-full flex flex-col gap-[10px] px-[8px] pb-[8px]">
          <div className="flex items-end justify-between w-full gap-2">
            <div className="flex flex-col items-start flex-1 min-w-0 max-w-[calc(100%-90px)]">
              <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-black">
                <p className="leading-[20px] truncate w-full">{product.title}</p>
              </div>
            </div>
            <div className="flex flex-col items-start flex-shrink-0">
              <div className="flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[16px] whitespace-nowrap">
                <p className="leading-[22px]">{formatPrice(product.price, currency)}</p>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={!product.inStock || isAddingToCart}
            className="bg-[#00d1ff] content-stretch flex h-[36px] items-center justify-center py-[8px] relative rounded-[20px] shrink-0 w-full hover:bg-[#00b8e6] hover:shadow-lg hover:shadow-[#00d1ff]/50 hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-white whitespace-nowrap">
              <p className="leading-[18px]">
                {isAddingToCart ? t('home.featuredProducts.adding') : t('home.featuredProducts.addToCart')}
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Full size version for home page — bottle extends beyond card, standing effect
  return (
    <div
      key={product.id}
      onClick={() => onProductClick(product)}
      className="flex flex-col items-center gap-[20px] lg:gap-[20px] md:gap-[24px] sm:gap-[24px] w-[280px] lg:w-[280px] md:w-[280px] sm:w-[240px] cursor-pointer product-card-hover z-[11] isolate product-card-glass rounded-lg p-2 overflow-visible"
    >
      {/* Image area: overflow visible so bottle can extend beyond card; bottle stands with shadow */}
      <div className="h-[200px] lg:h-[200px] md:h-[200px] sm:h-[180px] w-full relative product-image-container product-image-container-home flex items-end justify-center bg-transparent overflow-visible min-h-0">
        {product.image ? (
          <img
            alt={product.title}
            className="product-image-bottle-standing w-full max-w-[85%] h-auto object-contain object-bottom"
            src={product.image}
            style={{ backgroundColor: 'transparent' }}
          />
        ) : (
          <div className="w-full h-full bg-gray-300 rounded-lg" />
        )}
      </div>
      {/* Content Section - Uniform layout */}
      <div className="w-full flex flex-col gap-[14px] lg:gap-[14px] md:gap-[16px] sm:gap-[16px] px-[14px] lg:px-[14px] md:px-[16px] sm:px-[16px] pb-[14px] lg:pb-[14px] md:pb-[16px] sm:pb-[16px]">
        <div className="flex items-end justify-between w-full gap-2">
          <div className="flex flex-col items-start flex-1 min-w-0 max-w-[calc(100%-100px)]">
            <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-black">
              <p className="leading-[24px] lg:leading-[24px] md:leading-[24px] sm:leading-[20px] truncate w-full">{product.title}</p>
            </div>
          </div>
          <div className="flex flex-col items-start flex-shrink-0">
            <div className="flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[18px] lg:text-[18px] md:text-[18px] sm:text-[16px] whitespace-nowrap">
              <p className="leading-[26px] lg:leading-[26px] md:leading-[24px] sm:leading-[20px]">{formatPrice(product.price, currency)}</p>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          disabled={!product.inStock || isAddingToCart}
          className="bg-[#00d1ff] content-stretch flex h-[44px] lg:h-[44px] md:h-[48px] sm:h-[48px] items-center justify-center py-[10px] lg:py-[10px] md:py-[12px] sm:py-[12px] relative rounded-[30px] lg:rounded-[30px] md:rounded-[34px] sm:rounded-[34px] shrink-0 w-full hover:bg-[#00b8e6] hover:shadow-lg hover:shadow-[#00d1ff]/50 hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-300 cursor-pointer"
        >
          <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center text-white whitespace-nowrap">
            <p className="leading-[22px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px]">
              {isAddingToCart ? t('home.featuredProducts.adding') : t('home.featuredProducts.addToCart')}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

// Navigation Arrow Icon Component for Featured Products Carousel
interface NavigationArrowProps {
  direction: 'prev' | 'next';
  onClick: (e?: React.MouseEvent) => void;
  className?: string;
  isMobile?: boolean;
  ariaLabel?: string;
}

/**
 * Reusable Navigation Arrow Component for Featured Products
 * Can be used on home page and other pages with carousels
 */
export function FeaturedProductsNavigationArrow({
  direction,
  onClick,
  className = '',
  isMobile = false,
  ariaLabel,
}: NavigationArrowProps) {
  const imgIcon = "/assets/home/imgIcon.svg";
  
  if (isMobile) {
    // Mobile version with image icon
    // prev should point left (<-), next should point right (->)
    // Image icon points right by default, so:
    // - prev: -scale-y-100 (flip vertically, points left)
    // - next: -scale-y-100 rotate-180 (flip and rotate, points right)
    const iconTransform = direction === 'prev' 
      ? '-scale-y-100' 
      : '-scale-y-100 rotate-180';
    
    return (
      <button
        onClick={onClick}
        className={`bg-transparent border-[0.5px] border-[rgba(255,255,255,0.49)] border-solid content-stretch flex flex-col items-center justify-center px-[8.5px] py-[6.5px] relative rounded-[9999px] transition-colors duration-200 hover:border-[#00d1ff] hover:shadow-lg hover:shadow-[#00d1ff]/50 ${className}`}
        aria-label={ariaLabel}
      >
        <div className="relative shrink-0">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
            <div className="flex items-center justify-center relative shrink-0">
              <div className={`${iconTransform} flex-none`}>
                <div className="h-[28px] relative w-[24.02px]">
                  <img alt="" className="block max-w-none size-full" src={imgIcon} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Desktop version with SVG
  // Check if className contains positioning classes (relative, absolute, etc.) to avoid overriding
  const hasPositioning = className.includes('relative') || className.includes('absolute') || className.includes('fixed') || className.includes('sticky');
  // Check if className contains background classes to avoid overriding
  const hasBackground = className.includes('bg-');
  const baseClasses = hasPositioning 
    ? `${hasBackground ? '' : 'bg-transparent'} border-[0.5px] border-white/49 border-solid flex items-center justify-center px-[8.5px] py-[6.5px] rounded-full size-[50px] lg:size-[50px] md:size-[48px] sm:size-[40px] cursor-pointer hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:scale-95 transition-all duration-200 z-[10001] group`
    : `absolute ${hasBackground ? '' : 'bg-transparent'} border-[0.5px] border-white/49 border-solid flex items-center justify-center px-[8.5px] py-[6.5px] rounded-full size-[50px] lg:size-[50px] md:size-[48px] sm:size-[40px] cursor-pointer hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:scale-95 transition-all duration-200 z-[10001] group`;
  
  // Determine arrow direction - prev should point left (<-), next should point right (->)
  // SVG path points right by default, so:
  // - prev: no rotation (points left after scale-y-[-1])
  // - next: rotate 180 (points right after scale-y-[-1])
  const arrowTransform = direction === 'prev' 
    ? 'scale-y-[-1]' 
    : 'rotate-180 scale-y-[-1]';
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${className}`}
      aria-label={ariaLabel}
    >
      <svg
        preserveAspectRatio="none"
        width="24.02"
        height="28"
        viewBox="0 0 24.02 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`h-[25px] lg:h-[25px] md:h-[24px] sm:h-[20px] w-[21px] lg:w-[21px] md:w-[20px] sm:w-[18px] transform ${arrowTransform} group-hover:scale-y-[-1.1] transition-transform duration-200 pointer-events-none`}
      >
        <path
          d="M16.0692 13.0282H4.23242V14.9727H16.0692L10.6248 20.4171L12.0102 21.7782L19.788 14.0004L12.0102 6.22266L10.6248 7.58377L16.0692 13.0282Z"
          fill="white"
          className="group-hover:fill-[#00d1ff] transition-colors duration-200 pointer-events-none"
        />
      </svg>
    </button>
  );
}

// Admin Menu Components
export interface AdminMenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  isSubCategory?: boolean;
}

interface AdminMenuDrawerProps {
  tabs: AdminMenuItem[];
  currentPath: string;
}

/**
 * Renders a mobile-friendly admin hamburger menu that mirrors the desktop sidebar.
 */
export function AdminMenuDrawer({ tabs, currentPath }: AdminMenuDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      console.info('[AdminMenuDrawer] Locking body scroll for open drawer');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /**
   * Handles navigation button clicks inside the drawer.
   */
  const handleNavigate = (path: string) => {
    console.info('[AdminMenuDrawer] Navigating to admin path', { path });
    router.push(path);
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => {
          console.info('[AdminMenuDrawer] Toggling drawer', { open: !open });
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-gray-800 shadow-sm"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6H20M4 12H16M4 18H12" />
        </svg>
        Menu
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm"
          onClick={() => {
            console.info('[AdminMenuDrawer] Closing drawer from backdrop');
            setOpen(false);
          }}
        >
          <div
            className="h-full min-h-screen w-1/2 min-w-[16rem] max-w-full bg-white flex flex-col shadow-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <p className="text-lg font-semibold text-gray-900">Admin Navigation</p>
              <button
                type="button"
                onClick={() => {
                  console.info('[AdminMenuDrawer] Closing drawer from close button');
                  setOpen(false);
                }}
                className="h-10 w-10 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                aria-label="Close admin menu"
              >
                <svg className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {tabs.map((tab) => {
                const isActive =
                  currentPath === tab.path ||
                  (tab.path === '/admin' && currentPath === '/admin') ||
                  (tab.path !== '/admin' && currentPath.startsWith(tab.path));

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavigate(tab.path)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium ${
                      tab.isSubCategory ? 'pl-8' : ''
                    } ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={isActive ? 'text-white' : 'text-gray-500'}>{tab.icon}</span>
                      {tab.label}
                    </span>
                    <svg className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Unified admin navigation configuration.
 *
 * ԿԱՐԵՎՈՐ.
 * - Մենյուի բոլոր կետերը centrally պահում ենք այստեղ, որ բոլոր admin էջերում նույնը լինի։
 * - "Discounts" label-ը նույնն է ամեն տեղ, ուղիղ տանում է `/admin/quick-settings` էջ։
 * - "Delivery" կետը միշտ առկա է, այդ թվում Analytics և Filter by Price էջերում sidebar-ում։
 * 
 * Note: This function returns menu items with translated labels.
 * Use getAdminMenuTabs(t) in client components where t is from useTranslation().
 */
export function getAdminMenuTABS(t: (path: string) => string): AdminMenuItem[] {
  return [
  {
    id: 'dashboard',
    label: t('admin.menu.dashboard'),
    path: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    id: 'orders',
    label: t('admin.menu.orders'),
    path: '/admin/orders',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    id: 'products',
    label: t('admin.menu.products'),
    path: '/admin/products',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    id: 'categories',
    label: t('admin.menu.categories'),
    path: '/admin/categories',
    isSubCategory: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
  },
  {
    id: 'brands',
    label: t('admin.menu.brands'),
    path: '/admin/brands',
    isSubCategory: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
  },
  {
    id: 'attributes',
    label: t('admin.menu.attributes'),
    path: '/admin/attributes',
    isSubCategory: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
  },
  {
    id: 'quick-settings',
    label: t('admin.menu.discounts'),
    path: '/admin/quick-settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: 'users',
    label: t('admin.menu.users'),
    path: '/admin/users',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: t('admin.menu.analytics'),
    path: '/admin/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    id: 'price-filter-settings',
    label: t('admin.menu.filterByPrice'),
    path: '/admin/price-filter-settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>
    ),
  },
  {
    id: 'delivery',
    label: t('admin.menu.delivery'),
    path: '/admin/delivery',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
  },
  {
    id: 'blog',
    label: t('admin.menu.blog'),
    path: '/admin/blog',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 4h10a2 2 0 012 2v12l-4-2-4 2-4-2-4 2V6a2 2 0 012-2z"
        />
      </svg>
    ),
  },
  {
    id: 'messages',
    label: t('admin.menu.messages'),
    path: '/admin/messages',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: t('admin.menu.settings'),
    path: '/admin/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  ];
}

// Profile Menu Components
export interface ProfileMenuItem {
  id: 'dashboard' | 'orders' | 'personal' | 'addresses' | 'password';
  label: string;
  icon: React.ReactNode;
}

/**
 * Unified profile navigation configuration.
 * 
 * Profile menu tabs for user dashboard.
 * Use getProfileMenuTABS(t) in client components where t is from useTranslation().
 */
export function getProfileMenuTABS(t: (path: string) => string): ProfileMenuItem[] {
  return [
    {
      id: 'dashboard' as const,
      label: t('profile.tabs.dashboard'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'orders' as const,
      label: t('profile.tabs.orders'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'personal' as const,
      label: t('profile.tabs.personal'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'addresses' as const,
      label: t('profile.tabs.addresses'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'password' as const,
      label: t('profile.tabs.password'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];
}

