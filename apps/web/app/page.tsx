'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { formatPrice, getStoredCurrency } from '../lib/currency';
import { getStoredLanguage, setStoredLanguage, LANGUAGES, type LanguageCode } from '../lib/language';
import { useAuth } from '../lib/auth/AuthContext';
import { useTranslation } from '../lib/i18n-client';
import { CartIcon } from '../components/icons/CartIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { HeaderCartIcon } from '../components/icons/HeaderCartIcon';
import { LanguageIcon } from '../components/icons/LanguageIcon';
import { ExitIcon } from '../components/icons/ExitIcon';
import { Header, Footer, Button, addToCart } from '../components/icons/HomePageComponents';

// Local image paths - Images stored in public/assets/home/
const imgBorborAguaLogoColorB2024Colored1 = "/assets/home/imgBorborAguaLogoColorB2024Colored1.png";
const imgDanielSinocaAancLsb0SU0Unsplash1 = "/assets/home/imgDanielSinocaAancLsb0SU0Unsplash1.jpg";
const img = "/assets/home/img.png";
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
const imgShape3 = "/assets/home/imgShape3.svg";
const imgEllipse43 = "/assets/home/imgEllipse43.svg";
const imgGroup2105 = "/assets/home/imgGroup2105.svg";
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
// Image 5 and Image 11 for decorative bubbles with specific colors from Figma
const imgImage5 = "/assets/home/imgImage5.png";
const imgImage11 = "/assets/home/imgImage11.png";

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
const imgIcon1 = "/assets/home/imgIcon1.svg";
const imgDanielSinocaAancLsb0SU0Unsplash3 = "/assets/home/imgDanielSinocaAancLsb0SU0Unsplash3.jpg";
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
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  // State for featured products
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  // State for Trusted By section pagination
  const [trustedByIndex, setTrustedByIndex] = useState(0);
  // State for mobile bottom navigation active icon (null = none selected)
  const [activeMobileNavIndex, setActiveMobileNavIndex] = useState<number | null>(null);

  // Removed scaling logic - using Tailwind responsive classes instead
  // This prevents zoom issues and conflicts with responsive design

  // Carousel index tracking (removed debug logs for production)

  // State for header navigation
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
  const handleLanguageChange = (langCode: LanguageCode) => {
    setStoredLanguage(langCode);
    setShowLanguageMenu(false);
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
      // Move to previous mode (3 products back)
      const newIndex = prevIndex - 3;
      // If we go below 0, loop to the last mode (6 for products 6-8)
      if (newIndex < 0) {
        return 6; // Last mode
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
      // Move to next mode (3 products forward)
      const newIndex = prevIndex + 3;
      // If we exceed 6 (last mode), loop back to start (0)
      if (newIndex > 6) {
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

    const success = await addToCart({
      product,
      quantity: 1,
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
      {/* Mobile / Tablet Version - Visible up to xl */}
      <div className="xl:hidden bg-white relative w-full max-w-[430px] sm:max-w-none mx-auto min-h-screen overflow-x-hidden">
        {/* Mobile Header */}
        <div className="absolute content-stretch flex items-center justify-between left-[17px] right-[17px] top-[35px] z-50">
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
          <div className="h-[31px] relative shrink-0 w-[101px] cursor-pointer ml-4 md:ml-6" onClick={() => router.push('/')}>
            <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBorborAguaLogoColorB2024Colored1} />
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 bg-gradient-to-b from-[#62b3e8] to-[rgba(11, 55, 168, 0.75)] backdrop-blur-sm z-[100] xl:hidden flex items-center justify-center" onClick={() => setShowMobileMenu(false)}>
            <div 
              className="relative bg-white rounded-2xl border border-gray-200/50 shadow-2xl w-[280px] max-w-[90%] p-8 animate-in fade-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowMobileMenu(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Menu Items */}
              <nav className="flex flex-col gap-6">
                <button
                  onClick={() => {
                    router.push('/profile');
                    setShowMobileMenu(false);
                  }}
                  className="text-left text-gray-400 font-bold text-lg uppercase tracking-wide hover:text-gray-600 transition-colors"
                >
                  MY ACCOUNT
                </button>
                <button
                  onClick={() => {
                    router.push('/products');
                    setShowMobileMenu(false);
                  }}
                  className="text-left text-gray-400 font-bold text-lg uppercase tracking-wide hover:text-gray-600 transition-colors"
                >
                  CATALOG
                </button>
                <button
                  onClick={() => {
                    router.push('/delivery-terms');
                    setShowMobileMenu(false);
                  }}
                  className="text-left text-gray-400 font-bold text-lg uppercase tracking-wide hover:text-gray-600 transition-colors"
                >
                  DELIVERY
                </button>
                <button
                  onClick={() => {
                    router.push('/cart');
                    setShowMobileMenu(false);
                  }}
                  className="text-left text-gray-400 font-bold text-lg uppercase tracking-wide hover:text-gray-600 transition-colors"
                >
                  CART
                </button>
                
                <div className="h-px bg-gray-200 my-2" />
                
                <button
                  onClick={() => {
                    setShowLanguageMenu(!showLanguageMenu);
                  }}
                  className="text-left text-gray-400 font-bold text-lg uppercase tracking-wide hover:text-gray-600 transition-colors"
                >
                  LANGUAGE
                </button>
                {isLoggedIn && (
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="text-left text-gray-400 font-bold text-lg uppercase tracking-wide hover:text-gray-600 transition-colors"
                  >
                    LOG OUT
                  </button>
                )}
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

        {/* Mobile Hero Section Decorative Group */}
        <div className="absolute inset-[12%_8%_76%_8%]">
          <img alt="Decorative Group" className="block max-w-none size-full figma-fade-in" src={imgGroup2105} />
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
        <div className="absolute flex h-[480px]   items-center justify-center left-[-0.6] right-0 top-[4350px] w-full ">
          <div className="relative w-full h-full">
            <img
              alt=""
              className="absolute left-1/2 -translate-x-1/2 w-[120%] h-full object-cover"
              src={imgDanielSinocaAancLsb0SU0Unsplash3}
            />
          </div>
        </div>
        <div className="absolute flex h-[873px] items-center justify-center left-0 right-0 top-[4820px] w-full">
          <div className="-scale-y-100 flex-none">
            <div className="blur-[2px] h-[873px] relative w-[2078px]">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img alt="" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash3} />
              </div>
            </div>
          </div>
        </div>

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
        <div className="-translate-x-1/2 absolute h-[1001px] left-[calc(50%+3px)] top-[3427px] w-[460px]">
          <div className="absolute inset-[-36.46%_-79.35%]">
            <img alt="" className="block max-w-none size-full" src={imgEllipse44} />
          </div>
        </div>
        <div className="absolute flex h-[325px] items-center justify-center left-[164px] mix-blend-lighten top-[3409px] w-[211.999px]">
          <div className="flex-none rotate-180">
            <div className="h-[325px] relative w-[211.999px]">
              <img alt="" className="block max-w-none size-full" src={imgVector5} />
            </div>
          </div>
        </div>
        <div className="absolute flex h-[325px] items-center justify-center left-[154px] mix-blend-lighten top-[3694px] w-[211.999px]">
          <div className="-scale-y-100 flex-none rotate-180">
            <div className="h-[365px] relative w-[178.352px]">
              <img alt="" className="block max-w-none size-full" src={imgVector5} />
            </div>
          </div>
        </div>
        <div className="-translate-x-1/2 absolute h-[703px] left-[calc(50%-551.5px)] top-[2900px] w-[745px]">
          <div className="absolute inset-[-66.15%_-62.42%]">
            <img alt="" className="block max-w-none size-full" src={imgEllipse43} />
          </div>
        </div>
        <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-341.38px)] mix-blend-luminosity size-[748.757px] top-[2846.24px]">
          <div className="flex-none rotate-[-145.33deg]">
            <div className="relative size-[538.18px]">
              <img alt="" className="block max-w-none size-full" src={imgShape2} />
            </div>
          </div>
        </div>
        <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-257.56px)] mix-blend-luminosity size-[336.875px] top-[2207px]">
          <div className="flex-none rotate-[75.86deg]">
            <div className="relative size-[277.505px]">
              <img alt="" className="block max-w-none size-full" src={imgShape3} />
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


        {/* Mobile Featured Products Section Decorative Bubbles */}
        <div className="absolute flex items-center justify-center left-[67.21%] right-[-23.97%] top-[calc(.09%+958px)] bottom-[calc(100%-82.65%)]">
          <div className="flex-none rotate-[100.79deg] size-[210px]">
            <div className="relative rounded-[320px] size-full">
              {/* Soft blue glow bubble without dark blend artifacts */}
              <div className="absolute inset-0 backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] rounded-full" />
              <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
                  <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                </div>
              </div>
            </div>
          </div>
        </div>
          <div className="absolute flex items-center justify-center left-[67.67%] right-[4.12%] top-[calc(16.72%+958px)] bottom-[calc(100%-81.17%)]">
            <div className="flex-none rotate-[100.79deg] size-[100px]">
              <div className="relative rounded-[320px] size-full">
                {/* Soft blue glow bubble without dark blend artifacts */}
                <div className="absolute inset-0 backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] rounded-full" />
                <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
                    <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                  </div>
                </div>
              </div>
            </div>
        </div>
        <div className="absolute flex items-center justify-center left-[-15.81%] right-[67.75%] top-[calc(17.4%+958px)] bottom-[calc(100%-79%)]">
          <div className="flex-none rotate-[100.79deg] size-[160px]">
            <div className="relative rounded-[320px] size-full">
              {/* Soft blue glow bubble without dark blend artifacts */}
              <div className="absolute inset-0 backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] rounded-full" />
              <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
                  <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Left decorative bubble near Featured Products - fixed 200px from left on all mobile widths */}
        <div className="absolute flex items-center justify-center left-[-70px] top-[calc(-2%+958px)]">
          <div className="flex-none rotate-[100.79deg] size-[160px]">
            <div className="relative rounded-[320px] size-full">
              {/* Soft blue glow bubble without dark blend artifacts */}
              <div className="absolute inset-0 backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] rounded-full" />
              <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
                  <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                </div>
              </div>
            </div>
          </div>
        </div>

       

        {/* Mobile Hero Image */}
        <div className="-translate-x-1/2 absolute bottom-[88.94%] flex items-center justify-center left-1/2 top-[48%] w-full max-w-[440px]">
          <div className="flex-none rotate-[100.79deg] size-[360px]">
            <div className="relative rounded-[320px] size-full">
              {/* Soft blue glow behind the bottle without darkening artifacts */}
              <div className="absolute inset-0 backdrop-blur-[4px] bg-[rgba(118,179,233,0.42)] rounded-full" />
              <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
                  <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Mobile Hero Text */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center justify-center left-[calc(50%-2.5px)] top-[331px] w-[361px] z-10">
          <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[56px] relative shrink-0 text-[56px] text-white w-full whitespace-pre-wrap">
            <p className="mb-0">{t('home.hero.your')}</p>
            <p className="font-['Montserrat:Light',sans-serif] font-light mb-0">{t('home.hero.dailyDose')}</p>
            <p className="font-['Montserrat:Light',sans-serif] font-light mb-0">{t('home.hero.of')}</p>
            <p>{t('home.hero.freshness')}</p>
          </div>
        </div>

        {/* Mobile Hero Text Bottom Gradient Overlay */}
        <div className="absolute bg-gradient-to-b blur-[40px] from-[rgba(98,179,232,0.85)] h-[150px] left-0 right-0 opacity-75 to-[rgba(221,216,216,0.6)] top-[520px] z-0" />

        {/* Mobile Experience Purity Label */}
        <div className="absolute content-stretch flex gap-[12px] items-center left-[32px] right-[-32px] top-[311px]">
          <div className="bg-white h-[2px] shrink-0 w-[48px]" />
          <div className="content-stretch flex flex-col items-start relative shrink-0">
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-white tracking-[1.4px] uppercase whitespace-nowrap">
              <p className="leading-[20px]">{t('home.hero.experiencePurity')}</p>
            </div>
          </div>
        </div>

        {/* Mobile Subtitle */}
        <div className="absolute content-stretch flex flex-col items-center justify-center left-[32px] max-w-[512px] right-[207px] top-[564px]">
          <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white whitespace-nowrap">
            <p className="leading-[32.5px]">{t('home.hero.subtitle')}</p>
          </div>
        </div>

        {/* Mobile Hero Section Bottom Gradient Overlay */}
        <div className="absolute bg-gradient-to-b blur-[40px] from-[rgba(98,179,232,0.8)] h-[150px] left-0 right-0 opacity-70 to-[rgba(221,216,216,0.6)] top-[700px] z-0" />

        {/* Mobile CTA Buttons */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[8px] h-[136px] items-center justify-end left-1/2 pt-[16px] top-[675px] w-full max-w-[430px] px-4 z-10">
          <button
            onClick={() => router.push('/products')}
            className="bg-[#31daff] content-stretch flex flex-col h-[60px] items-center justify-center px-[40px] py-[16px] relative rounded-[9999px] shrink-0 w-[368px] cursor-pointer transition-all duration-300 hover:bg-[#00b8e6] hover:shadow-lg hover:shadow-[#31daff]/50 hover:scale-105 active:scale-95"
          >
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">
              <p className="leading-[24px]">{t('home.hero.shopNow')}</p>
            </div>
          </button>
          <button
            onClick={() => router.push('/about')}
            className="bg-[rgba(0,0,0,0)] border-2 border-white/30 content-stretch flex flex-col h-[60px] items-center justify-center px-[40px] py-[16px] relative rounded-[9999px] shrink-0 w-[368px] cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-white/50 hover:shadow-lg hover:shadow-white/20 hover:scale-105 active:scale-95"
          >
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[19px] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-[89px]">
              <p className="leading-[24px] whitespace-pre-wrap">{t('home.hero.learnMore')}</p>
            </div>
          </button>
        </div>

        {/* Mobile Bottom Navigation Frame - sticky expressive glassmorphism bar */}
        <div className="-translate-x-1/2 fixed xl:hidden left-1/2 bottom-0 w-full max-w-[430px] px-4 pb-5 z-50">
          <div className="relative bg-white/5 backdrop-blur-3xl h-[72px] rounded-[999px] shadow-[0_20px_55px_rgba(0,0,0,0.25)] border border-white/10 overflow-hidden">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex items-center justify-center left-1/2 top-1/2 w-[348px]">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-[252px]">
                {/* Home */}
                <button
                  onClick={() => {
                    setActiveMobileNavIndex(0);
                    router.push('/');
                  }}
                  className="group h-[56px] w-[56px] relative flex items-center justify-center transition-transform duration-200 hover:-translate-y-1 active:scale-95"
                >
                  {activeMobileNavIndex === 0 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <img className="block max-w-none size-[56px] opacity-70" alt="" src={imgEllipse2} />
                    </div>
                  )}
                  <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-250" />
                  <img className="relative block max-w-none size-[19px]" alt="" src={imgHomeVector} />
                </button>
                {/* Cart */}
                <button
                  onClick={() => {
                    setActiveMobileNavIndex(1);
                    router.push('/products');
                  }}
                  className="group block cursor-pointer h-[56px] w-[56px] relative flex items-center justify-center opacity-90 hover:opacity-100 transition-transform duration-200 hover:scale-110 hover:-translate-y-1 active:scale-95"
                >
                  {activeMobileNavIndex === 1 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <img className="block max-w-none size-[56px] opacity-70" alt="" src={imgEllipse2} />
                    </div>
                  )}
                  <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-250" />
                  <img className="relative block max-w-none size-[20px]" alt="" src={imgVector1} />
                </button>
                {/* Profile */}
                <button
                  onClick={() => {
                    setActiveMobileNavIndex(2);
                    router.push('/cart');
                  }}
                  className="group block cursor-pointer h-[56px] w-[56px] relative flex items-center justify-center opacity-90 hover:opacity-100 transition-transform duration-200 hover:scale-110 hover:-translate-y-1 active:scale-95"
                >
                  {activeMobileNavIndex === 2 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <img className="block max-w-none size-[56px] opacity-70" alt="" src={imgEllipse2} />
                    </div>
                  )}
                  <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-250" />
                  <img className="relative block max-w-none h-[22.312px] w-[25px]" alt="" src={imgGroup2148} />
                </button>
                {/* Contact */}
                <button
                  onClick={() => {
                    setActiveMobileNavIndex(3);
                    router.push('/profile');
                  }}
                  className="group block cursor-pointer h-[56px] w-[56px] relative flex items-center justify-center opacity-90 hover:opacity-100 transition-transform duration-200 hover:scale-110 hover:-translate-y-1 active:scale-95"
                >
                  {activeMobileNavIndex === 3 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <img className="block max-w-none size-[56px] opacity-70" alt="" src={imgEllipse2} />
                    </div>
                  )}
                  <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-250" />
                  <img className="relative block max-w-none h-[22px] w-[18.526px]" alt="" src={imgGroup2149} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Featured Products Gradient Overlay */}
        <div className="absolute bg-gradient-to-b blur-[30px] from-[#62b3e8] h-[300px] left-0 right-0 pointer-events-none to-[rgba(255, 255, 255, 0.07)] top-[738px] w-full z-[1]" data-node-id="3:2019" />

        {/* Mobile Featured Products Section */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[7px] h-[123px] items-center justify-center left-1/2 top-[958px] w-full max-w-[429px] px-4 z-10">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat:Black',sans-  serif] font-black justify-center leading-[40px] relative shrink-0 text-[40px] text-center text-white tracking-[-0.9px] uppercase whitespace-nowrap">
              <p className="mb-0">{t('home.featuredProducts.title')}</p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
              <p className="leading-[24px]">{t('home.featuredProducts.subtitle')}</p>
            </div>
          </div>
          <div className="bg-[#00d1ff] h-[5px] rounded-[30px] shrink-0 w-[90px]" />
        </div>

        {/* Mobile Featured Product Card */}
        {featuredProducts.length > 0 && (() => {
          const currentProduct = featuredProducts[carouselIndex] || featuredProducts[0];
          return (
            <div
              className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[40px] items-center left-1/2 px-[16px] top-[1088px] w-full max-w-[371px] cursor-pointer"
              onClick={() => handleOpenProduct(currentProduct)}
            >
              <div className="h-[435px] relative shrink-0 w-[155px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <img
                    alt={currentProduct.title}
                    className="absolute h-[110.66%] left-[-104.92%] max-w-none top-[-5.74%] w-[309.84%] object-contain"
                    src={currentProduct.image || imgBorborAquaProductKids033L2}
                  />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[6px] items-start py-px relative shrink-0 w-full">
                <div className="content-stretch flex h-[24px] items-end justify-between relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col items-start relative shrink-0">
                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                      <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[28px] relative shrink-0 text-[18px] text-white whitespace-nowrap">
                        <p className="mb-0">{currentProduct.title}</p>
                      </div>
                    </div>
                    {(currentProduct.subtitle || currentProduct.description) && (
                      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full mt-1">
                        <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[12px] tracking-[1.2px] uppercase whitespace-nowrap">
                          <p className="leading-[16px]">{currentProduct.subtitle || currentProduct.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0">
                    <div className="flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[20px] whitespace-nowrap">
                      <p className="leading-[28px]">
                        {formatPrice(currentProduct.price, getStoredCurrency())}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(currentProduct);
                  }}
                  disabled={addingToCart.has(currentProduct.id) || !currentProduct.inStock}
                  className="bg-[#00d1ff] content-stretch cursor-pointer flex h-[48px] items-center justify-center py-[12px] relative rounded-[34px] shrink-0 w-[339px] disabled:opacity-50"
                >
                  <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
                    <p className="leading-[24px]">
                      {addingToCart.has(currentProduct.id) ? t('home.featuredProducts.adding') : t('home.featuredProducts.addToCart')}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Mobile Carousel Navigation */}
        <div className="-translate-x-1/2 absolute content-stretch flex items-center justify-between left-1/2 top-[1285px] w-full max-w-[500px] px-4">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
            <button
              onClick={handlePreviousProducts}
              className="bg-[rgba(0,0,0,0)] border-[0.5px] border-[rgba(255,255,255,0.49)] border-solid col-1 content-stretch flex flex-col items-center justify-center ml-0 mt-0 px-[8.5px] py-[6.5px] relative rounded-[9999px] row-1 transition-colors duration-200 hover:bg-[#00d1ff] hover:border-[#00d1ff]"
            >
              <div className="relative shrink-0">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                  <div className="flex items-center justify-center relative shrink-0">
                    <div className="-scale-y-100 flex-none">
                      <div className="h-[28px] relative w-[24.02px]">
                        <img alt="" className="block max-w-none size-full" src={imgIcon} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
          <div className="flex items-center justify-center relative shrink-0">
            <div className="-scale-y-100 flex-none rotate-180">
              <button
                onClick={handleNextProducts}
                className="bg-[rgba(0,0,0,0)] border-[0.5px] border-[rgba(255,255,255,0.49)] border-solid content-stretch flex flex-col items-center justify-center px-[8.5px] py-[6.5px] relative rounded-[9999px] transition-colors duration-200 hover:bg-[#00d1ff] hover:border-[#00d1ff]"
              >
                <div className="relative shrink-0">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                    <div className="flex items-center justify-center relative shrink-0">
                      <div className="-scale-y-100 flex-none">
                        <div className="h-[28px] relative w-[24.02px]">
                          <img alt="" className="block max-w-none size-full" src={imgIcon} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Pagination Dots (interactive, synced with featured products carousel) */}
        {featuredProducts.length > 3 && (
          <div className="-translate-x-1/2 absolute flex items-center justify-center gap-[10px] left-1/2 top-[1666px]">
            {/* Dot 1 - First mode (products 0-2) */}
            <button
              type="button"
              onClick={() => setCarouselIndex(0)}
              className={`rounded-full transition-all duration-300 ${
                carouselIndex === 0
                  ? 'bg-[#00d1ff] h-[8px] w-[20px]'
                  : 'bg-white size-[8px] hover:bg-[#00d1ff]/50'
              }`}
              aria-label={t('home.trustedBy.showFirstFeaturedProducts')}
            />
            {/* Dot 2 - Second mode (products 3-5) */}
            <button
              type="button"
              onClick={() => setCarouselIndex(3)}
              className={`rounded-full transition-all duration-300 ${
                carouselIndex === 3
                  ? 'bg-[#00d1ff] h-[8px] w-[20px]'
                  : 'bg-white size-[8px] hover:bg-[#00d1ff]/50'
              }`}
              aria-label={t('home.trustedBy.showMiddleFeaturedProducts')}
            />
            {/* Dot 3 - Third mode (products 6-8) */}
            <button
              type="button"
              onClick={() => setCarouselIndex(6)}
              className={`rounded-full transition-all duration-300 ${
                carouselIndex === 6
                  ? 'bg-[#00d1ff] h-[8px] w-[20px]'
                  : 'bg-white size-[8px] hover:bg-[#00d1ff]/50'
              }`}
              aria-label={t('home.trustedBy.showLastFeaturedProducts')}
            />
          </div>
        )}

        {/* Mobile View All Products Button */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center left-[calc(50%+1.5px)] top-[1708px] w-[241px]">
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
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[9px] items-start left-[calc(50%+1.5px)] top-[1840px] lg:top-[1835px] w-full max-w-[429px]">
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
        <div className="-translate-x-1/2 absolute left-[calc(50%-10.5px)] top-[1900px] lg:top-[1895px] w-[322px] h-[372px]">
          <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[54.84%_0.99%_16.56%_68.49%] justify-center leading-[0] text-[#0f172a] text-[0px] tracking-[-0.9px] uppercase whitespace-nowrap">
            <p className="leading-[20px] mb-0 text-[23px]">{t('home.waterEnergySection.pure')}</p>
            <p className="leading-[20px] mb-0 text-[23px]">{t('home.waterEnergySection.energy')}</p>
            <p className="font-['Montserrat:Regular',sans-serif] font-normal leading-[16px] mb-0 text-[11px]">{t('home.waterEnergySection.drawnFrom')}</p>
            <p className="font-['Montserrat:Regular',sans-serif] font-normal leading-[16px] mb-0 text-[11px]">{t('home.waterEnergySection.nature')}</p>
            <p className="font-['Montserrat:Regular',sans-serif] font-normal leading-[16px] mb-0 text-[11px]">{t('home.waterEnergySection.capturedIn')}</p>
            <p className="font-['Montserrat:Regular',sans-serif] font-normal leading-[16px] text-[11px]">{t('home.waterEnergySection.everyDrop')}</p>
          </div>
          <div className="absolute flex flex-col font-['Montserrat:Regular',sans-serif] font-normal inset-[22.8%_59.55%_60%_13.65%] justify-center leading-[16px] text-[#0f172a] text-[14px] text-right tracking-[-0.9px] uppercase whitespace-nowrap">
            <p className="mb-0">{t('home.waterEnergySection.crystal')}</p>
            <p className="mb-0">{t('home.waterEnergySection.clarityThat')}</p>
            <p className="mb-0">{t('home.waterEnergySection.refreshesThe')}</p>
            <p className="mb-0">{t('home.waterEnergySection.bodyAnd')}</p>
            <p>{t('home.waterEnergySection.restores')}</p>
          </div>
          <div className="absolute flex items-center justify-center inset-[43.01%_56.32%_-14.63%_-38.96%]">
            <div className="flex-none rotate-[100.79deg] size-[210px]">
              <div className="relative rounded-[320px] size-full">
                {/* Soft blue glow bubble without dark blend artifacts */}
                <div className="absolute inset-0 backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] rounded-full" />
                <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
                    <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                  </div>
                </div>
              </div>
            </div>
          </div>


         


    


          <div className="absolute contents inset-[5.91%_9.77%_0.02%_3.97%]">
            <div className="absolute contents inset-[5.91%_9.77%_0.02%_16.13%]">
              <div className="absolute contents inset-[5.91%_9.77%_0.02%_16.13%]">
                <div className="absolute inset-[9.43%_9.77%_67.89%_74%]" data-name="Vector" data-node-id="3:2109">
                  <div className="absolute inset-[0_3.7%_4.59%_0.78%]">
                    <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/08813665-fb7d-46ff-a20b-bd1f72beebdf" />
                  </div>
                </div>
                <div className="absolute inset-[48.32%_67.73%_31.94%_18%]" data-name="Vector" data-node-id="3:2110">
                  <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/4621d6c7-4dbd-4afd-9ec4-29430094f5e3" />
                </div>
                <div className="absolute aspect-[157.45058065837884/437.4313836472372] flex items-center justify-center left-[34.21%] right-[26.72%] top-[27.48px]">
                  <div className="flex-none h-[436.107px] rotate-[-0.5deg] w-[153.651px]">
                    <div className="relative size-full" data-name="\sqawdef 1">
                      <div className="absolute inset-0 opacity-88 overflow-hidden pointer-events-none">
                        <img alt="" className="absolute h-full left-[-91.91%] max-w-none top-0 w-[283.83%]" src="https://www.figma.com/api/mcp/asset/655c1036-cbe5-4609-b621-924834d6314f" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-[15.61%_15.04%_66.56%_63.72%]" data-name="glass">
                  <div className="absolute inset-[-3.62%_-4.67%_-6.03%_-4.67%]">
                    <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/aadbc746-1d0b-416c-8ec8-f41cc8e9d911" />
                  </div>
                </div>
                <div className="absolute inset-[54.8%_56.51%_27.38%_22.25%]" data-name="glass">
                  <div className="absolute inset-[-3.62%_-4.67%_-6.03%_-4.67%]">
                    <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/cd530067-d699-40ac-bdbd-e431ca8dce60" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[37.63%_59.55%_51.61%_3.97%] justify-center leading-[0] text-[#09c1ff] text-[29px] text-right tracking-[-0.9px] uppercase whitespace-nowrap">
              <p className="leading-[50px]">{t('home.waterEnergySection.balance')}</p>
            </div>
          </div>
        </div>

        {/* Mobile Stats Cards */}
        <div className="-translate-x-1/2 absolute content-stretch flex gap-[8px] items-start left-[calc(50%+3px)] top-[2462px]">
          <div className="h-[227px] relative rounded-[30px] shrink-0 w-[180px] overflow-hidden">
            <img
              alt=""
              className="absolute h-[149.05%] left-[-49.49%] max-w-none top-[-32.36%] w-[149.49%]"
              src={imgScreenshot20260114At0835551}
            />
          </div>
          <div className="h-[227px] relative shrink-0 w-[208px]">
            <div className="absolute bg-[#1ac0fd] inset-0 rounded-[30px]" />
            <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[69.6%_4.09%_15.58%_36.3%] justify-center leading-[0] text-[48px] text-center text-white tracking-[-0.9px] uppercase">
              <p className="leading-[40px] whitespace-pre-wrap">98%</p>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[4.41%_28.61%_36.12%_7.93%] justify-center leading-[24px] text-[0px] text-[24px] text-white tracking-[-0.9px] uppercase whitespace-pre-wrap">
              <p className="mb-0">{t('home.cards.pureSpringWater.pure')}</p>
              <p className="mb-0">{t('home.cards.pureSpringWater.spring')}</p>
              <p className="mb-0">{t('home.cards.pureSpringWater.water')}</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light mb-0">{t('home.cards.pureSpringWater.from')}</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light">{t('home.cards.pureSpringWater.armenia')}</p>
            </div>
            <div className="absolute flex flex-col font-['Inter:Medium_Italic',sans-serif] font-medium inset-[84.65%_8.65%_6.46%_44.71%] italic justify-center leading-[0] text-[14px] text-right text-white">
              <p className="leading-[24px] whitespace-pre-wrap">{t('home.cards.pureSpringWater.source')}</p>
            </div>
          </div>
        </div>

        <div className="-translate-x-1/2 absolute content-stretch flex gap-[8px] items-start left-[calc(50%+3px)] top-[2708px]">
          <div className="h-[227px] relative shrink-0 w-[208px]">
            <div className="absolute bg-white inset-0 rounded-[30px]" />
            <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[69.6%_3.85%_15.42%_31.25%] justify-center leading-[0] text-[#0f172a] text-[48px] text-center tracking-[-0.9px] uppercase">
              <p className="leading-[40px] whitespace-pre-wrap">100%</p>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[4.41%_16.83%_36.12%_7.69%] justify-center leading-[24px] text-[#1ac0fd] text-[0px] text-[24px] tracking-[-0.9px] uppercase whitespace-pre-wrap">
              <p className="mb-0">{t('home.cards.balancedHydration.balanced')}</p>
              <p className="mb-0">{t('home.cards.balancedHydration.hydration')}</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light mb-0">{t('home.cards.balancedHydration.every')}</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light">{t('home.cards.balancedHydration.day')}</p>
            </div>
            <div className="absolute flex flex-col font-['Inter:Medium_Italic',sans-serif] font-medium inset-[84.65%_8.65%_6.46%_44.71%] italic justify-center leading-[0] text-[#1ac0fd] text-[14px] text-right">
              <p className="leading-[24px] whitespace-pre-wrap">{t('home.cards.balancedHydration.source')}</p>
            </div>
          </div>
          <div className="h-[227px] relative rounded-[30px] shrink-0 w-[180px] overflow-hidden">
            <img
              alt=""
              className="absolute h-[101.64%] left-[-13.07%] max-w-none top-[-1.52%] w-[126.15%]"
              src={imgScreenshot20260112At1535403}
            />
          </div>
        </div>

        {/* Mobile Why Choose Us Section */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[9px] items-start left-[calc(50%+0.5px)] top-[3113px] w-full max-w-[429px]">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[40px] text-center tracking-[-0.9px] uppercase w-full">
                <p className="leading-[40px] whitespace-pre-wrap">{t('home.whyChooseUs.title')}</p>
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
        </div>

        {/* Mobile Why Choose Us Cards */}
        <div className="-translate-x-1/2 absolute left-[calc(50%+0.5px)] top-[3210px] w-[361px]">
          <div className="relative content-stretch flex flex-col gap-[50px] items-end w-full">
          {/* Decorative Vectors - Same as Water Energy */}
          <div className="absolute contents inset-[5.91%_9.77%_0.02%_3.97%]">
            <div className="absolute contents inset-[5.91%_9.77%_0.02%_16.13%]">
              <div className="absolute contents inset-[5.91%_9.77%_0.02%_16.13%]">
                <div className="absolute inset-[9.43%_9.77%_67.89%_74%]" data-name="Vector">
                  <div className="absolute inset-[0_3.7%_4.59%_0.78%]">
                    <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/08813665-fb7d-46ff-a20b-bd1f72beebdf" />
                  </div>
                </div>
          
              </div>
            </div>
          </div>
          <div className="h-[286px] relative shrink-0 w-full" data-node-id="3:2132">
            <div className="absolute bg-white inset-[18.18%_0_0_0] rounded-[37px]" data-node-id="3:2133" />
            <div className="absolute aspect-[100/100] left-[33.98%] right-[33.7%] top-0" data-name="pc" data-node-id="0:182">
              <div className="relative size-full">
                <div className="absolute inset-[9.48%_-14.22%_18.97%_34.91%]" data-name="Vector" data-node-id="0:183">
                  <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/f252f37e-868c-46c2-be96-f822d3aab537" />
                </div>
                <div className="absolute inset-[29.31%_16.81%_0_9.91%]" data-name="glass" data-node-id="0:184">
                  <div className="absolute inset-[-3.66%_-4.71%_-6.1%_-4.71%]">
                    <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/e777528f-0907-4aa7-a28e-871308fd4e93" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal inset-[61.19%_11.7%_22.03%_11.98%] justify-center leading-[24px] not-italic text-[#64748b] text-[16px] text-center whitespace-pre-wrap" data-node-id="3:2135">
              <p className="mb-0">{t('home.whyChooseUs.richInMinerals.descriptionLine1')}</p>
              <p>{t('home.whyChooseUs.richInMinerals.descriptionLine2')}</p>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Bold',sans-serif] font-bold inset-[49.3%_22.56%_40.91%_22.84%] justify-center leading-[0] text-[#0f172a] text-[20px] text-center uppercase" data-node-id="3:2136">
              <p className="leading-[28px] whitespace-pre-wrap">{t('home.whyChooseUs.richInMinerals.title')}</p>
            </div>
          </div>
          <div className="h-[278px] relative shrink-0 w-full" data-node-id="3:2137">
            <div className="absolute bg-white inset-[15.83%_0_0_0] rounded-[37px]" data-node-id="3:2138" />
            <div className="absolute aspect-[100/100] left-[33.52%] right-[34.08%] top-0" data-name="warning" data-node-id="0:165">
              <div className="relative size-full">
                <div className="absolute inset-[5.88%_-4.86%_26.15%_50.33%]" data-name="Group" data-node-id="0:166">
                  <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/fbb7061c-d20f-4cdf-b279-e5796eec7550" />
                </div>
                <div className="absolute inset-[13.93%_8.94%_9.09%_8.94%]" data-name="glass" data-node-id="0:169">
                  <div className="absolute inset-[-3.36%_-4.2%_-5.6%_-4.2%]">
                    <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/be7ad9f7-327f-4e89-9ba1-222f20a54476" />
                  </div>
                </div>
                <div className="absolute inset-[39.77%_45.45%_20.45%_45.45%]" data-name="top" data-node-id="0:170">
                  <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/15315365-c5b2-42c7-9756-074acb2eb650" />
                </div>
              </div>
            </div>
            <div className="absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal inset-[60.07%_8.94%_22.66%_8.38%] justify-center leading-[24px] not-italic text-[#64748b] text-[16px] text-center whitespace-pre-wrap" data-node-id="3:2140">
              <p className="mb-0">{t('home.whyChooseUs.noArtificialIngredients.descriptionLine1')}</p>
              <p>{t('home.whyChooseUs.noArtificialIngredients.descriptionLine2')}</p>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Bold',sans-serif] font-bold inset-[47.84%_9.5%_42.09%_8.94%] justify-center leading-[0] text-[#0f172a] text-[20px] text-center uppercase" data-node-id="3:2141">
              <p className="leading-[28px] whitespace-pre-wrap">{t('home.whyChooseUs.noArtificialIngredients.title')}</p>
            </div>
          </div>
          <div className="h-[272px] relative shrink-0 w-full" data-node-id="3:2142">
            <div className="absolute bg-white inset-[13.97%_-0.55%_0_0] rounded-[37px]" data-node-id="3:2143" />
            <div className="absolute aspect-[100/100] left-[34.07%] overflow-clip right-[33.8%] top-0" data-name="leaf" data-node-id="0:150">
              <div className="relative size-full">
                <div className="absolute inset-[10.22%_10.23%_61.04%_62.5%]" data-name="bg" data-node-id="0:151">
                  <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/5fd94071-5e89-4d8b-9dc1-0186aee60a37" />
                </div>
                <div className="absolute inset-[16.22%_15.91%_6.5%_4.41%]" data-name="glass" data-node-id="0:152">
                  <div className="absolute inset-[-3.35%_-4.33%_-5.58%_-4.33%]">
                    <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/7dbb068b-eecb-4cb8-8b19-c14124babcea" />
                  </div>
                </div>
                <div className="absolute inset-[32.96%_31.82%_25.5%_35.23%]" data-name="top" data-node-id="0:153">
                  <img alt="" className="block max-w-none size-full" src="https://www.figma.com/api/mcp/asset/0ffabdd4-6cad-4a82-85b4-c6701ed0bb8f" />
                </div>
              </div>
            </div>
            <div className="absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal inset-[60.66%_11.91%_24.63%_12.19%] justify-center leading-[20px] not-italic text-[#64748b] text-[16px] text-center whitespace-nowrap" data-node-id="3:2145">
              <p className="mb-0">{t('home.whyChooseUs.nonCarbonated.descriptionLine1')}</p>
              <p>{t('home.whyChooseUs.nonCarbonated.descriptionLine2')}</p>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Bold',sans-serif] font-bold inset-[46.69%_21.05%_43.01%_21.61%] justify-center leading-[0] text-[#0f172a] text-[20px] text-center uppercase whitespace-nowrap" data-node-id="3:2146">
              <p className="leading-[28px]">{t('home.whyChooseUs.nonCarbonated.title')}</p>
            </div>
          </div>
          </div>
        </div>

        {/* Mobile Trusted By Section */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[9px] items-center justify-center left-[calc(50%+0.5px)] top-[4227px] w-full max-w-[429px]">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[40px] text-center tracking-[-0.9px] uppercase w-full">
                <p className="leading-[40px] whitespace-pre-wrap">{t('home.trustedBy.title')}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[14px] text-center uppercase whitespace-nowrap">
            <p className="leading-[16px]">{t('home.trustedBy.subtitle')}</p>
          </div>
          <div className="flex items-center justify-center relative shrink-0 w-full">
            <div className="-scale-y-100 flex-none w-full">
              <div className="content-stretch flex h-[9px] items-start justify-center relative w-full">
                <div className="bg-[#00d1ff] h-[5px] rounded-[30px] shrink-0 w-[90px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Trusted By Logo - uses same 3 logos as desktop via trustedByIndex */}
        <div className="-translate-x-1/2 absolute content-stretch flex items-center justify-center left-1/2 top-[4360px] w-full">
          <div className="h-[72px] relative shrink-0 w-[260px]">
            <img
              alt={TRUSTED_BY_LOGOS[trustedByIndex].alt}
              className="absolute inset-0 max-w-none object-contain pointer-events-none size-full"
              src={TRUSTED_BY_LOGOS[trustedByIndex].src}
            />
          </div>
        </div>

        {/* Mobile Trusted By Navigation - same handlers as desktop */}
        <div className="-translate-x-1/2 absolute content-stretch flex h-[41px] items-center justify-between left-1/2 top-[4374px] w-full max-w-[470px] px-4">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
            <button
              onClick={handlePreviousTrustedBy}
              className="bg-[rgba(0,0,0,0)] border-[#eee] border-[0.5px] border-solid col-1 content-stretch flex flex-col items-center justify-center ml-0 mt-0 px-[8.5px] py-[6.5px] relative rounded-[9999px] row-1 transition-colors duration-200 hover:bg-[#00d1ff] hover:border-[#00d1ff]"
            >
              <div className="relative shrink-0">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                  <div className="flex items-center justify-center relative shrink-0">
                    <div className="-scale-y-100 flex-none">
                      <div className="h-[28px] relative w-[24.02px]">
                        <img alt="" className="block max-w-none size-full" src={imgIcon1} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
          <div className="flex items-center justify-center relative shrink-0">
            <div className="-scale-y-100 flex-none rotate-180">
              <button
                onClick={handleNextTrustedBy}
                className="bg-[rgba(0,0,0,0)] border-[#eee] border-[0.5px] border-solid content-stretch flex flex-col items-center justify-center px-[8.5px] py-[6.5px] relative rounded-[9999px] transition-colors duration-200 hover:bg-[#00d1ff] hover:border-[#00d1ff]"
              >
                <div className="relative shrink-0">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                    <div className="flex items-center justify-center relative shrink-0">
                      <div className="-scale-y-100 flex-none">
                        <div className="h-[28px] relative w-[24.02px]">
                          <img alt="" className="block max-w-none size-full" src={imgIcon1} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Trusted By Pagination Dots */}
        <div className="-translate-x-1/2 absolute flex items-center justify-center gap-[10px] left-1/2 top-[4450px]">
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

        {/* Mobile Footer */}
        <div className="absolute content-stretch flex flex-col gap-[30px] items-start justify-center left-[35px] top-[4539px] w-[339px] pb-[0px]">
          <div className="h-[312px] relative shrink-0 w-full">
            <div className="absolute content-stretch flex h-[34px] items-center left-0 top-0 w-[336px]">
              <div className="h-[34px] relative shrink-0 w-[112px]">
                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBorborAguaLogoColorB2024Colored1} />
              </div>
            </div>
            <div className="absolute content-stretch flex flex-col items-start left-0 top-[58px] w-[336px]">
              <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-full">
                <p className="leading-[26px] whitespace-pre-wrap">{t('home.footer.description')}</p>
              </div>
            </div>
            <div className="absolute flex items-center gap-[9px] left-0 top-[280px] cursor-pointer" onClick={() => router.push('/about')}>
              <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[14px] whitespace-nowrap">
                <p className="leading-[22px]">{t('home.footer.more')}</p>
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
          <div className="content-stretch flex flex-col gap-[1px] h-[165px] items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-white tracking-[1.4px] uppercase w-full">
                <p className="leading-[20px] whitespace-pre-wrap">CONTACT</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-[249px]">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white whitespace-pre-wrap">
                  <p className="mb-0 leading-[24px]">Office: <a href="tel:0037433000401" className="underline">+374 33 000401</a></p>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                  <p className="leading-[24px] whitespace-pre-wrap">Delivery: <a href="tel:0037441012004" className="underline">+374 41 012004</a></p>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                  <p className="leading-[24px] whitespace-pre-wrap">Email: <a href="mailto:borboraqua.am@gmail.com" className="underline">info@borboraqua.am</a></p>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[24px] not-italic relative shrink-0 text-[16px] text-white w-[228px] whitespace-pre-wrap">
                  <p className="mb-0">Location: 1412, Gegharkunik,</p>
                  <p className="mb-0">v. Dzoragyugh, Armenia</p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[6px] h-[140px] items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-white tracking-[1.4px] uppercase w-full">
                <p className="leading-[20px] whitespace-pre-wrap">POLICIES</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
              <button onClick={() => router.push('/privacy')} className="text-left">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                  <p className="leading-[24px] whitespace-pre-wrap">Privacy Policy</p>
                </div>
              </button>
              <button onClick={() => router.push('/terms')} className="text-left">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                  <p className="leading-[24px] whitespace-pre-wrap">Terms & Conditions</p>
                </div>
              </button>
              <button onClick={() => router.push('/delivery-terms')} className="text-left">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                  <p className="leading-[24px] whitespace-pre-wrap">Delivery Terms</p>
                </div>
              </button>
              <button onClick={() => router.push('/refund-policy')} className="text-left">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-full">
                  <p className="leading-[24px] whitespace-pre-wrap">Refund Policy</p>
                </div>
              </button>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[6px] h-[312px] items-start relative shrink-0 w-[94px]">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-white tracking-[1.4px] uppercase w-full">
                <p className="leading-[20px] whitespace-pre-wrap">SITE MAP</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
              <button onClick={() => router.push('/about')} className="text-left w-full">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                  <p className="leading-[24px] whitespace-pre-wrap">About Us</p>
                </div>
              </button>
              <button onClick={() => router.push('/contact')} className="text-left w-full">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                  <p className="leading-[24px] whitespace-pre-wrap">Contact</p>
                </div>
              </button>
              <button onClick={() => router.push('/products')} className="text-left w-full">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                  <p className="leading-[24px] whitespace-pre-wrap">Shop</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Footer Copyright */}
        <div className="-translate-x-1/2 absolute border-[#e2e8f0] border-solid border-t content-stretch flex flex-col gap-[21px] items-center justify-center left-1/2 pt-[29px] top-[5380px] w-[386px] z-10">
          <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap">
            <p className="leading-[16px]">Copyright © 2024 | New Aqua LLC | All Rights Reserved</p>
          </div>
          <div className="relative shrink-0">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[13px] items-center justify-end relative">
              <div className="h-[24.998px] relative shrink-0 w-[77.198px]">
                <img alt="" className="block max-w-none size-full" src={imgGroup2122} />
              </div>
              <div className="h-[29.209px] relative shrink-0 w-[48.946px]">
                <img alt="" className="block max-w-none size-full" src={imgGroup2121} />
              </div>
              <div className="h-[25.209px] relative shrink-0 w-[98.706px]">
                <img alt="" className="block max-w-none size-full" src={imgGroup2124} />
              </div>
              <div className="h-[25px] relative shrink-0 w-[87.735px]">
                <img alt="" className="block max-w-none size-full" src={imgGroup2123} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Version - Only for extra large screens */}
      <div
        ref={containerRef}
        className="hidden xl:block bg-white relative w-full mx-auto h-[6170px] home-page-container overflow-x-hidden overflow-y-hidden"
      >
      <Header
        router={router}
        t={t}
        setShowSearchModal={setShowSearchModal}
        setShowLanguageMenu={setShowLanguageMenu}
        showLanguageMenu={showLanguageMenu}
        handleLanguageChange={handleLanguageChange}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        setShowUserMenu={setShowUserMenu}
        showUserMenu={showUserMenu}
        handleLogout={handleLogout}
        languageMenuRef={languageMenuRef}
        userMenuRef={userMenuRef}
        isHomePage={true}
      />

      {/* Background Gradient */}
      <div className="absolute bg-gradient-to-b blur-[50px] from-[#62b3e8] h-[1075px] left-1/2 to-[rgba(221,216,216,0.75)] top-0 translate-x-[-50%] w-full max-w-[1920px]" />

      {/* Hero Section Decorative Group */}
      <div className="absolute inset-[3.34%_14.2%_90%_14.64%]">
        <img alt="Decorative Group" className="block max-w-none size-full figma-fade-in" src={imgGroup2105} />

      </div>

      {/* Image 13 - Decorative Element */}
      <div className="absolute flex items-center justify-center left-1/2 top-[410px] translate-x-[-50%] size-[606px] pointer-events-none">
        <div className="relative rounded-[320px] size-full">
          {/* Soft blue glow bubble without dark blend artifacts */}
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Image 13" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]"  />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] rounded-[900px]" />
        </div>
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
      <div className="absolute h-[527px] left-1/2 top-[1158px] translate-x-[-50%] w-full max-w-[1920px] z-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="Water Wave" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash1} />
        </div>
      </div>

      {/* Blurred Reflection */}
      <div className="absolute flex h-[807px] items-center justify-center left-1/2 top-[1741px] translate-x-[-50%] w-full max-w-[1920px]">
        <div className="flex-none scale-y-[-100%]">
          <div className="blur-[2px] h-[807px] relative w-full max-w-[1920px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img alt="Water Wave Reflection" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash1} />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements - Ellipses */}
      <div className="absolute h-[1124px] left-[calc(50%+953.5px)] top-[2396px] translate-x-[-50%] w-[1191px] overflow-hidden">
        <div className="absolute inset-0 figma-float-slow">
          <img alt="Ellipse" className="block max-w-none size-full" src={imgEllipse41} />
        </div>
      </div>

      <div className="absolute h-[1051px] left-1/2 top-[4100px] translate-x-[-50%] w-[2808px] overflow-hidden "  >
        <div className="absolute inset-0 figma-float">
          <img alt="Ellipse" className="block max-w-none size-full" src={imgEllipse44} />
        </div>
      </div>

      <div className="absolute h-[1124px] left-[calc(50%-1113.5px)] top-[3102px] translate-x-[-50%] w-[1191px] overflow-hidden">
        <div className="absolute inset-0 figma-float-slow">
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

      <div className="absolute flex items-center justify-center left-[calc(50%+119.2px)] size-[956.401px]  top-[5197px] translate-x-[-50%]">
        <div className="flex-none rotate-[-16.26deg] scale-y-[-100%] ">
          <div className="relative size-[524.132px] ">
            <img alt="Shape" className="block max-w-none size-full " src={imgShape3}   />
            {/* White background overlay with gradient for bottom section */}
          </div>
        </div>
      </div>

      <div className="absolute flex items-center justify-center left-[calc(50%-587.04px)] size-[541.928px] top-[3100px] translate-x-[-50%]">
        <div className="flex-none rotate-[-165deg]">
          <div className="relative size-[524.132px]">
            <img alt="Shape" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
      </div>

      <div className="absolute flex items-center justify-center left-[calc(50%-1082.68px)] size-[944.637px] top-[3493px] translate-x-[-50%]">
        <div className="flex-none rotate-[-165deg]">
          <div className="relative size-[771.293px]">
            <img alt="Shape" className="block max-w-none size-full" src={imgShape3} />
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="absolute h-[1050px] lg:h-[1050px] md:h-[900px] sm:h-[700px] left-1/2 top-[1150px] lg:top-[1150px] md:top-[1000px] sm:top-[800px] translate-x-[-50%] w-full max-w-[1920px] overflow-hidden">
        {/* Background Image - Daniel Sianca Flipped */}
        <div
          className="absolute w-full h-full"
          style={{
            top: "50%",
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
            background: "linear-gradient(to bottom, transparent 0%, transparent 15%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0) 70%, rgba(255, 255, 255, 0.3) 85%, white 100%)"
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


          

          {/* Products Grid - Uniform Layout */}
          <div className="absolute h-[390px] lg:h-[390px] md:h-[330px] sm:h-[270px] left-0 lg:left-0 md:left-[16px] sm:left-[12px] right-0 lg:right-0 md:right-[16px] sm:right-[12px] top-[180px] lg:top-[180px] md:top-[150px] sm:top-[120px] z-[10]">
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
                  return visibleProducts.map((product) => {
                    const currency = getStoredCurrency();
                    const formattedPrice = formatPrice(product.price, currency);

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleOpenProduct(product)}
                        className="flex flex-col items-center gap-[20px] lg:gap-[20px] md:gap-[24px] sm:gap-[24px] w-[280px] lg:w-[280px] md:w-[280px] sm:w-[240px] cursor-pointer product-card-hover z-[11] isolate bg-transparent"
                      >
                        {/* Image Container - Uniform size with overflow hidden */}
                        <div className="h-[280px] lg:h-[280px] md:h-[280px] sm:h-[240px] w-full relative overflow-hidden flex items-center justify-center bg-transparent">
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
                        {/* Content Section - Uniform layout */}
                        <div className="w-full flex flex-col gap-[14px] lg:gap-[14px] md:gap-[16px] sm:gap-[16px] px-[14px] lg:px-[14px] md:px-[16px] sm:px-[16px] pb-[14px] lg:pb-[14px] md:pb-[16px] sm:pb-[16px]">
                          <div className="flex items-end justify-between w-full">
                            <div className="flex flex-col items-start">
                              <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white">
                                <p className="leading-[24px] lg:leading-[24px] md:leading-[24px] sm:leading-[20px]">{product.title}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-start">
                              <div className="flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[18px] lg:text-[18px] md:text-[18px] sm:text-[16px] whitespace-nowrap">
                                <p className="leading-[26px] lg:leading-[26px] md:leading-[24px] sm:leading-[20px]">{formattedPrice}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            disabled={!product.inStock || addingToCart.has(product.id)}
                            className="bg-[#00d1ff] content-stretch flex h-[44px] lg:h-[44px] md:h-[48px] sm:h-[48px] items-center justify-center py-[10px] lg:py-[10px] md:py-[12px] sm:py-[12px] relative rounded-[30px] lg:rounded-[30px] md:rounded-[34px] sm:rounded-[34px] shrink-0 w-full hover:bg-[#00b8e6] hover:shadow-lg hover:shadow-[#00d1ff]/50 hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-300 cursor-pointer"
                          >
                            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center text-white whitespace-nowrap">
                              <p className="leading-[22px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px]">
                                {addingToCart.has(product.id) ? t('home.featuredProducts.adding') : t('home.featuredProducts.addToCart')}
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : null}
          </div>


          {/* Pagination Dots - Show 3 dots for 3 carousel modes (positioned above "View All Products" on non-mobile) */}
          {featuredProducts.length > 3 && (
            <div className="absolute contents left-1/2 top-[760px] translate-x-[-50%]">
              {/* Dot 1 - First mode (products 0-2) */}
              <button
                type="button"
                onClick={() => setCarouselIndex(0)}
                className={`absolute rounded-full top-[760px] translate-x-[-50%] transition-all duration-300 ${
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
                className={`absolute rounded-full top-[760px] translate-x-[-50%] transition-all duration-300 ${
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
                className={`absolute rounded-full top-[760px] translate-x-[-50%] transition-all duration-300 ${
                  carouselIndex === 6
                    ? 'bg-[#00d1ff] h-[6px] w-[16px] left-[calc(50%+17px)]'
                    : 'bg-[#e2e8f0] size-[6px] left-[calc(50%+17px)] hover:bg-[#00d1ff]/50'
                }`}
                aria-label={t('home.trustedBy.showThird3Products')}
              />
            </div>
          )}

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
                        <img alt="Arrow" className="block max-w-none size-full" src={img4} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blue Underline */}
          <div className="absolute content-stretch flex items-start justify-center left-1/2 top-[100px] lg:top-[100px] md:top-[110px] sm:top-[110px] translate-x-[-50%] w-[980px] lg:w-[980px] md:w-[90%] sm:w-[95%]">
            <div className="bg-[#00d1ff] h-[4px] lg:h-[4px] md:h-[5px] sm:h-[5px] rounded-[25px] lg:rounded-[25px] md:rounded-[30px] sm:rounded-[30px] shrink-0 w-[80px] lg:w-[80px] md:w-[90px] sm:w-[90px]" />
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Only show if we have more than 3 products - Outside overflow-hidden container */}
      {featuredProducts.length > 3 && (
        <>
          {/* Next Button - Left side */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🖱️ [CAROUSEL] Next button clicked');
              handleNextProducts(e);
            }}
            className="absolute bg-transparent border-[0.5px] border-white/49 border-solid flex items-center justify-center px-[8.5px] py-[6.5px] rounded-full size-[50px] lg:size-[50px] md:size-[48px] sm:size-[40px] cursor-pointer hover:bg-white/20 hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:bg-white/30 active:scale-95 transition-all duration-200 z-[10001] group left-[calc(50%-580px)] lg:left-[calc(50%-580px)] md:left-[calc(50%-500px)] sm:left-[calc(50%-400px)] top-[1580px] lg:top-[1580px] md:top-[1350px] sm:top-[1090px]"
            aria-label={t('home.trustedBy.nextProducts')}
          >
            <svg
              preserveAspectRatio="none"
              width="24.02"
              height="28"
              viewBox="0 0 24.02 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-[25px] lg:h-[25px] md:h-[24px] sm:h-[20px] w-[21px] lg:w-[21px] md:w-[20px] sm:w-[18px] transform rotate-180 scale-y-[-1] group-hover:scale-y-[-1.1] transition-transform duration-200 pointer-events-none"
            >
              <path
                d="M16.0692 13.0282H4.23242V14.9727H16.0692L10.6248 20.4171L12.0102 21.7782L19.788 14.0004L12.0102 6.22266L10.6248 7.58377L16.0692 13.0282Z"
                fill="white"
                className="group-hover:fill-[#00d1ff] transition-colors duration-200 pointer-events-none"
              />
            </svg>
          </button>

          {/* Previous Button - Right side */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🖱️ [CAROUSEL] Previous button clicked');
              handlePreviousProducts(e);
            }}
            className="absolute bg-transparent border-[0.5px] border-white/49 border-solid flex items-center justify-center px-[8.5px] py-[6.5px] rounded-full size-[50px] lg:size-[50px] md:size-[48px] sm:size-[40px] cursor-pointer hover:bg-white/20 hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:bg-white/30 active:scale-95 transition-all duration-200 z-[10001] group right-[calc(50%-580px)] lg:right-[calc(50%-580px)] md:right-[calc(50%-500px)] sm:right-[calc(50%-400px)] top-[1580px] lg:top-[1580px] md:top-[1350px] sm:top-[1110px]"
            aria-label={t('home.trustedBy.previousProducts')}
          >
            <svg
              preserveAspectRatio="none"
              width="24.02"
              height="28"
              viewBox="0 0 24.02 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-[25px] lg:h-[25px] md:h-[24px] sm:h-[20px] w-[21px] lg:w-[21px] md:w-[20px] sm:w-[18px] transform scale-y-[-1] group-hover:scale-y-[-1.1] transition-transform duration-200 pointer-events-none"
            >
              <path
                d="M16.0692 13.0282H4.23242V14.9727H16.0692L10.6248 20.4171L12.0102 21.7782L19.788 14.0004L12.0102 6.22266L10.6248 7.58377L16.0692 13.0282Z"
                fill="white"
                className="group-hover:fill-[#00d1ff] transition-colors duration-200 pointer-events-none"
              />
            </svg>
          </button>
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
          <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[12.83%_5.28%_58.02%_22.26%] lg:inset-[12.83%_5.28%_58.02%_22.26%] md:inset-[12.83%_5.28%_58.02%_22.26%] sm:inset-[12.83%_5.28%_58.02%_22.26%] justify-center leading-[28px] lg:leading-[44px] md:leading-[40px] sm:leading-[32px] text-[#00d1ff] text-[26px] lg:text-[40px] md:text-[36px] sm:text-[28px] text-right tracking-[-0.8px] lg:tracking-[-0.8px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
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
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
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
        <div className="absolute bg-white inset-[18.18%_0_0_0] rounded-[30px] lg:rounded-[37px]" />
        <div className="absolute aspect-[100/100] left-[34.13%] right-[34.93%] top-0">
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
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[61.19%_13.33%_22.03%_13.6%] lg:inset-[61.19%_13.33%_22.03%_13.6%] md:inset-[61.19%_13.33%_22.03%_13.6%] sm:inset-[61.19%_13.33%_22.03%_13.6%] justify-center leading-[18px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px] not-italic text-[#64748b] text-[12px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center">
          <p className="mb-0">{t('home.whyChooseUs.richInMinerals.description')}</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[49.3%_24%_40.91%_23.73%] lg:inset-[49.3%_24%_40.91%_23.73%] md:inset-[49.3%_24%_40.91%_23.73%] sm:inset-[49.3%_24%_40.91%_23.73%] justify-center leading-[0] text-[#0f172a] text-[15px] lg:text-[18px] md:text-[18px] sm:text-[16px] text-center uppercase whitespace-nowrap">
          <p className="leading-[21px] lg:leading-[26px] md:leading-[24px] sm:leading-[20px]">{t('home.whyChooseUs.richInMinerals.title')}</p>
        </div>
      </div>

      {/* Card 2: Non-Carbonated */}
      <div className="absolute h-[200px] lg:h-[250px] md:h-[240px] sm:h-[220px] left-1/2 translate-x-[-50%] lg:translate-x-[-700px] md:translate-x-[-50%] sm:translate-x-[-50%] top-[4580px] lg:top-[4580px] md:top-[4000px] sm:top-[3280px] w-[272px] lg:w-[340px] md:w-[45%] sm:w-[90%] z-[100]">
        <div className="absolute bg-white inset-[13.97%_0_0_0] rounded-[30px] lg:rounded-[37px]" />
        <div className="absolute aspect-[100/100] left-[37.07%] overflow-clip right-[32%] top-0">
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
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[60.66%_13.33%_24.63%_13.6%] lg:inset-[60.66%_13.33%_24.63%_13.6%] md:inset-[60.66%_13.33%_24.63%_13.6%] sm:inset-[60.66%_13.33%_24.63%_13.6%] justify-center leading-[14px] lg:leading-[18px] md:leading-[18px] sm:leading-[16px] not-italic text-[#64748b] text-[12px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center">
          <p className="mb-0">{t('home.whyChooseUs.nonCarbonated.description')}</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[46.69%_22.4%_43.01%_22.4%] lg:inset-[46.69%_22.4%_43.01%_22.4%] md:inset-[46.69%_22.4%_43.01%_22.4%] sm:inset-[46.69%_22.4%_43.01%_22.4%] justify-center leading-[0] text-[#0f172a] text-[15px] lg:text-[18px] md:text-[18px] sm:text-[16px] text-center uppercase whitespace-nowrap">
          <p className="leading-[21px] lg:leading-[26px] md:leading-[24px] sm:leading-[20px]">{t('home.whyChooseUs.nonCarbonated.title')}</p>
        </div>
      </div>

      {/* Card 3: No Artificial Ingredients */}
      <div className="absolute h-[204px] lg:h-[255px] md:h-[240px] sm:h-[220px] left-1/2 translate-x-[-50%] lg:translate-x-[330px] md:translate-x-[-50%] sm:translate-x-[-50%] top-[4430px] lg:top-[4430px] md:top-[4300px] sm:top-[3560px] w-[272px] lg:w-[340px] md:w-[45%] sm:w-[90%] z-[100]">
        <div className="absolute bg-white inset-[15.83%_0_0_0] rounded-[30px] lg:rounded-[37px]" />
        <div className="absolute aspect-[100/100] left-[34.53%] right-[34.53%] top-0">
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
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[60.07%_10.4%_22.66%_10.67%] lg:inset-[60.07%_10.4%_22.66%_10.67%] md:inset-[60.07%_10.4%_22.66%_10.67%] sm:inset-[60.07%_10.4%_22.66%_10.67%] justify-center leading-[18px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px] not-italic text-[#64748b] text-[12px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center">
          <p className="mb-0">{t('home.whyChooseUs.noArtificialIngredients.description')}</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[47.84%_11.2%_42.09%_10.93%] lg:inset-[47.84%_11.2%_42.09%_10.93%] md:inset-[47.84%_11.2%_42.09%_10.93%] sm:inset-[47.84%_11.2%_42.09%_10.93%] justify-center leading-[0] text-[#0f172a] text-[15px] lg:text-[18px] md:text-[18px] sm:text-[16px] text-center uppercase whitespace-nowrap">
          <p className="leading-[21px] lg:leading-[26px] md:leading-[24px] sm:leading-[20px]">{t('home.whyChooseUs.noArtificialIngredients.title')}</p>
        </div>
      </div>

      {/* Trusted By Section */}
      <div className="absolute content-stretch flex flex-col h-[328px] lg:h-[410px] md:h-[380px] sm:h-[320px] items-start left-1/2 px-[136px] lg:px-[170px] md:px-[48px] sm:px-[24px] py-[56px] lg:py-[70px] md:py-[60px] sm:py-[40px] top-[5050px] lg:top-[5050px] md:top-[4500px] sm:top-[3800px] translate-x-[-50%] w-full max-w-[1920px]">
        <div className="h-[200px] lg:h-[250px] md:h-[240px] sm:h-[200px] max-w-[1536px] relative shrink-0 w-full">
          <div className="absolute content-stretch flex flex-col items-center left-[calc(50%+0.5px)] top-[-24px] lg:top-[-30px] md:top-[-28px] sm:top-[-24px] translate-x-[-50%] w-[784px] lg:w-[980px] md:w-[90%] sm:w-[95%]">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[48px] lg:text-[60px] md:text-[48px] sm:text-[32px] text-center uppercase whitespace-nowrap">
              <p className="leading-[21px] lg:leading-[26px] md:leading-[24px] sm:leading-[22px]">{t('home.trustedBy.title')}</p>
            </div>
          </div>
          <div className="absolute content-stretch flex flex-col items-center left-[calc(50%+1px)] top-[26px] lg:top-[33px] md:top-[30px] sm:top-[24px] translate-x-[-50%] w-[784px] lg:w-[980px] md:w-[90%] sm:w-[95%]">
            <div className="flex flex-col font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[12px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center uppercase whitespace-nowrap">
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
            {/* Previous Button - Left side */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ [TRUSTED BY] Previous button clicked');
                handlePreviousTrustedBy(e);
              }}
              className="bg-gray-300 border-[#eee] border-[0.5px] border-solid flex items-center justify-center px-[6.8px] py-[5.2px] lg:px-[8.5px] lg:py-[6.5px] rounded-full size-[45px] lg:size-[56px] cursor-pointer hover:bg-black/80 hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:bg-black/70 active:scale-95 transition-all duration-200 relative z-[101] group"
              aria-label="Previous partner"
            >
              <svg
                preserveAspectRatio="none"
                width="24.02"
                height="28"
                viewBox="0 0 24.02 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-[29px] w-[24px] lg:h-[36px] lg:w-[30px] transform rotate-180 group-hover:scale-110 transition-transform duration-200 pointer-events-none"
              >
                <path
                  d="M16.0692 13.0282H4.23242V14.9727H16.0692L10.6248 20.4171L12.0102 21.7782L19.788 14.0004L12.0102 6.22266L10.6248 7.58377L16.0692 13.0282Z"
                  fill="white"
                  className="group-hover:fill-[#00d1ff] transition-colors duration-200 pointer-events-none"
                />
              </svg>
            </button>

            {/* Next Button - Right side */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ [TRUSTED BY] Next button clicked');
                handleNextTrustedBy(e);
              }}
              className="bg-gray-300 border-[#eee] border-[0.5px] border-solid flex items-center justify-center px-[6.8px] py-[5.2px] lg:px-[8.5px] lg:py-[6.5px] rounded-full size-[45px] lg:size-[56px] cursor-pointer hover:bg-black/80 hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:bg-black/70 active:scale-95 transition-all duration-200 relative z-[101] group"
              aria-label="Next partner"
            >
              <svg
                preserveAspectRatio="none"
                width="24.02"
                height="28"
                viewBox="0 0 24.02 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-[29px] w-[24px] lg:h-[36px] lg:w-[30px] transform group-hover:scale-110 transition-transform duration-200 pointer-events-none"
              >
                <path
                  d="M16.0692 13.0282H4.23242V14.9727H16.0692L10.6248 20.4171L12.0102 21.7782L19.788 14.0004L12.0102 6.22266L10.6248 7.58377L16.0692 13.0282Z"
                  fill="white"
                  className="group-hover:fill-[#00d1ff] transition-colors duration-200 pointer-events-none"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <Footer router={router} t={t} isHomePage={true} />

      {/* Additional Decorative Elements - Hero Section Bubbles */}
      {/* Background ellipse at original left position */}
      <div className="absolute top-[38.44%] left-[-10%] h-[800px] w-[600px]  overflow-hidden pointer-events-none">
        <img alt="Background Ellipse" className="block max-w-none size-full" src={imgEllipse41} />
      </div>

      {/* Main large bubble */}
      <div className="absolute flex top-[43.44%] right-[71%] bottom-[43.57%] left-0 items-center justify-center overflow-hidden">
        <div className="relative rounded-[320px] size-[384.622px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img
                alt="Decorative"
                className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]"
                src={img}
                onError={(e) => {
                  console.error('❌ [IMAGE] Failed to load decorative image:', img);
                  console.error('Error target:', e.target);
                }}
                onLoad={() => {
                  console.log('✅ [IMAGE] Decorative image loaded:', img);
                }}
              />
            </div>
          </div>
          <div  />
        </div>
      </div>

      {/* Image 5 - Decorative Element */}
      <div className="absolute flex items-center justify-center left-[1124px] top-[1350px] size-[200px]">
        <div className="relative rounded-[320px] size-full">
          {/* Soft blue glow bubble without dark blend artifacts */}
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Image 5" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={imgImage5} />
            </div>
          </div>
          <div />
        </div>
      </div>


      

      {/* Image 11 - Decorative Element */}
      <div className="absolute flex items-center justify-center left-[203px] top-[1433px] size-[150px]">
        <div className="relative rounded-[320px] size-full">
          {/* Soft blue glow bubble without dark blend artifacts */}
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Image 11" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={imgImage11} />
            </div>
          </div>
          <div />
        </div>
      </div>

      <div className="absolute flex inset-[22%_0.5%_77.5%_76.61%] items-center justify-center">
        <div className="relative rounded-[320px] size-[102.381px]">
          {/* Soft blue glow bubble without dark blend artifacts */}
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img
                alt="Decorative"
                className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]"
                src={img}
                onError={(e) => {
                  console.error('❌ [IMAGE] Failed to load decorative image:', img);
                  console.error('Error target:', e.target);
                }}
                onLoad={() => {
                  console.log('✅ [IMAGE] Decorative image loaded:', img);
                }}
              />
            </div>
          </div>
          <div />
        </div>
      </div>

      {/* Upper bubble - move to the right side a bit higher */}
      <div className="absolute flex top-[44%] right-[1%] bottom-[50.88%] left-auto items-center justify-center overflow-hidden">
        <div className="relative rounded-[320px] size-[339px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img
                alt="Decorative"
                className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]"
                src={img}
                onError={(e) => {
                  console.error('❌ [IMAGE] Failed to load decorative image:', img);
                  console.error('Error target:', e.target);
                }}
                onLoad={() => {
                  console.log('✅ [IMAGE] Decorative image loaded:', img);
                }}
              />
            </div>
          </div>
          <div  />
        </div>
      </div>

       {/* <div className="absolute flex top-[49.7%] right-[84.95%] bottom-[49.82%] left-0 items-center justify-center overflow-hidden">
         <div className="relative rounded-[320px] size-[304.957px]">
           <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
         <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
             <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
             <img
                alt="Decorative"
                className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]"
                src={img}
                onError={(e) => {
                  console.error('❌ [IMAGE] Failed to load decorative image:', img);
                  console.error('Error target:', e.target);
                }}
                onLoad={() => {
                  console.log('✅ [IMAGE] Decorative image loaded:', img);
                }}
              />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
        </div>
      </div> */}
      
      {/* // Lower bubble 2 - move a bit further down */}
      
      <div className="absolute flex top-[52%] right-[-6%] bottom-[41.8%] left-auto items-center justify-center overflow-hidden">
        <div className="relative rounded-[320px] size-[329px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img
                alt="Decorative"
                className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]"
                src={img}
                onError={(e) => {
                  console.error('❌ [IMAGE] Failed to load decorative image:', img);
                  console.error('Error target:', e.target);
                }}
                onLoad={() => {
                  console.log('✅ [IMAGE] Decorative image loaded:', img);
                }}
              />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
        </div>
      </div>


      {/* Lower bubble 3 - move fully to the right side */}
      <div className="absolute flex top-[52%] right-[1%] bottom-[35.23%] left-auto items-center justify-center overflow-hidden">
        <div className="relative rounded-[320px] size-[227.625px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img
                alt="Decorative"
                className="absolute left-[-14.37%] max-w-none size-[228.74%] top-[-14.67%]"
                src={img}
                onError={(e) => {
                  console.error('❌ [IMAGE] Failed to load decorative image:', img);
                  console.error('Error target:', e.target);
                }}
                onLoad={() => {
                  console.log('✅ [IMAGE] Decorative image loaded:', img);
                }}
              />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
        </div>
      </div>

      {/* Featured Products Section Decorative Elements */}

      <div className="absolute flex top-[1%] right-[75.18%] bottom-[55.65%] left-[-9.5%] items-center justify-center overflow-hidden">
        <div className="relative rounded-[320px] size-[256.082px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img
                alt="Decorative"
                className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]"
                src={img}
                onError={(e) => {
                  console.error('❌ [IMAGE] Failed to load decorative image:', img);
                  console.error('Error target:', e.target);
                }}
                onLoad={() => {
                  console.log('✅ [IMAGE] Decorative image loaded:', img);
                }}
              />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
        </div>
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
              <div className="absolute aspect-[244.35066986310085/678.8584334167344] flex items-center justify-center left-[33.81%] mix-blend-multiply right-[39.46%] top-0">
                <div className="flex-none h-[541px] rotate-[-0.5deg] w-[191px]">
                  <div className="relative size-full">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <img alt="Water Bottle" className="absolute h-full left-[-91.91%] max-w-none top-0 w-[283.83%]" src={img17} />
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
      <div className="absolute left-1/2 top-[4820px] translate-x-[-50%] w-[88px] h-[88px] z-[12]">
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
