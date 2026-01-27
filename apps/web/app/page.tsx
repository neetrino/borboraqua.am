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

// Product interface for featured products
interface Product {
  id: string;
  slug: string;
  title: string;
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

  // Removed scaling logic - using Tailwind responsive classes instead
  // This prevents zoom issues and conflicts with responsive design

  // Carousel index tracking (removed debug logs for production)

  // State for header navigation
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
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
   * Handle adding product to cart
   */
  const handleAddToCart = async (product: Product) => {
    if (!product.inStock) {
      return;
    }

    // If user is not logged in, redirect to login
    if (!isLoggedIn) {
      router.push(`/login?redirect=/`);
      return;
    }

    setAddingToCart(prev => new Set(prev).add(product.id));

    try {
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

      // Encode slug to handle special characters
      const encodedSlug = encodeURIComponent(product.slug.trim());
      const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);

      if (!productDetails.variants || productDetails.variants.length === 0) {
        alert(t('home.errors.noVariantsAvailable'));
        return;
      }

      const variantId = productDetails.variants[0].id;

      await apiClient.post(
        '/api/v1/cart/items',
        {
          productId: product.id,
          variantId: variantId,
          quantity: 1,
        }
      );

      // Trigger cart update event
      window.dispatchEvent(new Event('cart-updated'));
      console.log('✅ [HOMEPAGE] Product added to cart:', product.title);
    } catch (error: any) {
      console.error('❌ [HOMEPAGE] Error adding to cart:', error);

      // Check if error is about product not found
      if (error?.message?.includes('does not exist') || error?.message?.includes('404') || error?.status === 404) {
        alert(t('home.errors.productNotFound'));
        return;
      }

      // Check if error is about insufficient stock
      if (error.response?.data?.detail?.includes('No more stock available') ||
        error.response?.data?.detail?.includes('exceeds available stock') ||
        error.response?.data?.title === 'Insufficient stock') {
        alert(t('home.errors.noMoreStockAvailable'));
        return;
      }

      // If error is about authorization, redirect to login
      if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error?.status === 401) {
        router.push(`/login?redirect=/`);
      } else {
        alert(t('home.errors.failedToAddToCart'));
      }
    } finally {
      setAddingToCart(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  // Footer is at top-[6201px] with h-[700px], so total height = 6201 + 700 = 6901px
  // Using exact pixel height from Figma with responsive scaling
  return (
    <>
      {/* Mobile Version - Only visible on small screens (matches Figma design exactly) */}
      <div className="md:hidden bg-white relative w-full max-w-[430px] mx-auto min-h-screen overflow-x-hidden">
        {/* Mobile Header */}
        <div className="absolute content-stretch flex items-center justify-between left-[17px] top-[35px] w-[398px] z-50">
          <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
            <button
              onClick={() => setShowSearchModal(true)}
              className="bg-[rgba(0,0,0,0)] border-[0.5px] border-[rgba(255,255,255,0.49)] border-solid content-stretch cursor-pointer flex flex-col items-start px-[15.5px] py-[18.5px] relative rounded-[9999px] w-[49px]"
            >
              <div className="flex items-center justify-center relative shrink-0">
                <div className="-scale-y-100 flex-none rotate-180">
                  <div className="h-[12px] relative w-[18px]">
                    <img className="block max-w-none size-full" alt="" src={imgVector3} />
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setShowSearchModal(true)}
              className="bg-[rgba(0,0,0,0)] border-[0.5px] border-[rgba(255,255,255,0.49)] border-solid content-stretch cursor-pointer flex items-center p-[14.5px] relative rounded-[9999px]"
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
          <div className="h-[31px] relative shrink-0 w-[101px] cursor-pointer" onClick={() => router.push('/')}>
            <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBorborAguaLogoColorB2024Colored1} />
          </div>
        </div>

        {/* Mobile Background Gradient */}
        <div className="absolute bg-gradient-to-b blur-[50px] from-[#62b3e8] h-[850px] left-0 to-[rgba(221,216,216,0.75)] top-0 w-[430px]" />

        {/* Mobile Decorative Background Images */}
        <div className="absolute h-[312px] left-[-204px] top-[789px] w-[741px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash3} />
          </div>
        </div>
        <div className="absolute flex h-[312px] items-center justify-center left-[-203px] top-[1098px] w-[741px]">
          <div className="-scale-y-100 flex-none">
            <div className="h-[312px] relative w-[741px]">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img alt="" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash3} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute blur-[2px] h-[480px] left-[-355px] top-[4600px] w-[1143px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash3} />
          </div>
        </div>
        <div className="absolute flex h-[873px] items-center justify-center left-[-783px] top-[5075px] w-[2078px]">
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
        <div className="absolute flex h-[325px] items-center justify-center left-[102px] mix-blend-lighten top-[3684px] w-[178.352px]">
          <div className="-scale-y-100 flex-none rotate-180">
            <div className="h-[325px] relative w-[178.352px]">
              <img alt="" className="block max-w-none size-full" src={imgVector6} />
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
        <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+28.66px)] mix-blend-luminosity size-[597.326px] top-[4287px]">
          <div className="-scale-y-100 flex-none rotate-[-17.72deg]">
            <div className="relative size-[475.23px]">
              <img alt="" className="block max-w-none size-full" src={imgShape1} />
            </div>
          </div>
        </div>
        <div className="-translate-x-1/2 absolute h-[438px] left-[calc(50%-302px)] top-[1251px] w-[464px]">
          <div className="absolute inset-[-83.33%_-78.66%]">
            <img alt="" className="block max-w-none size-full" src={imgEllipse41} />
          </div>
        </div>


        {/* Mobile Featured Products Section Decorative Bubbles */}
        <div className="absolute flex items-center justify-center left-[67.21%] right-[-23.97%] top-[calc(13.09%+958px)] bottom-[calc(100%-82.65%)]">
          <div className="flex-none rotate-[100.79deg] size-[240px]">
            <div className="relative rounded-[320px] size-full">
              <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
              <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
                  <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                </div>
              </div>
              <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
            </div>
          </div>
        </div>
        <div className="absolute flex items-center justify-center left-[67.67%] right-[4.12%] top-[calc(16.72%+958px)] bottom-[calc(100%-81.17%)]">
          <div className="flex-none rotate-[100.79deg] size-[240px]">
            <div className="relative rounded-[320px] size-full">
              <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
              <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
                  <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                </div>
              </div>
              <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
            </div>
          </div>
        </div>
        <div className="absolute flex items-center justify-center left-[-15.81%] right-[67.75%] top-[calc(17.4%+958px)] bottom-[calc(100%-79%)]">
          <div className="flex-none rotate-[100.79deg] size-[240px]">
            <div className="relative rounded-[320px] size-full">
              <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
              <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
                  <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                </div>
              </div>
              <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
            </div>
          </div>
        </div>
        <div className="absolute flex items-center justify-center left-[-34.65%] right-[84.42%] top-[calc(15.76%+958px)] bottom-[calc(100%-80.47%)]">
          <div className="flex-none rotate-[100.79deg] size-[240px]">
            <div className="relative rounded-[320px] size-full">
              <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
              <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
                  <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                </div>
              </div>
              <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
            </div>
          </div>
        </div>

        {/* Mobile Decorative Elements */}
        <div className="absolute inset-[3.23%_6.74%_94.81%_7.44%]">
          <img alt="Decorative Group" className="block max-w-none size-full" src={imgGroup2105} />
        </div>

        {/* Mobile Hero Image */}
        <div className="-translate-x-1/2 absolute bottom-[88.94%] flex items-center justify-center left-[calc(50%-3.88px)] top-[48%] w-[440px]">
          <div className="flex-none rotate-[102.66deg] size-[360px]">
            <div className="relative rounded-[320px] size-full">
              <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
              <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
                  <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                </div>
              </div>
              <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
            </div>
          </div>
        </div>

        {/* Mobile Hero Text */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center justify-center left-[calc(50%-2.5px)] top-[340px] w-[361px] z-10">
          <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[56px] relative shrink-0 text-[56px] text-white w-full whitespace-pre-wrap">
            <p className="mb-0">YOUR</p>
            <p className="font-['Montserrat:Light',sans-serif] font-light mb-0">DAILY DOSE</p>
            <p className="font-['Montserrat:Light',sans-serif] font-light mb-0">OF</p>
            <p>FRESHNESS</p>
          </div>
        </div>

        {/* Mobile Hero Text Bottom Gradient Overlay */}
        <div className="absolute bg-gradient-to-b blur-[40px] from-[rgba(98,179,232,0.85)] h-[150px] left-0 opacity-75 to-[rgba(221,216,216,0.6)] top-[520px] w-[430px] z-0" />

        {/* Mobile Experience Purity Label */}
        <div className="absolute content-stretch flex gap-[12px] items-center left-[32px] right-[-32px] top-[311px]">
          <div className="bg-white h-[2px] shrink-0 w-[48px]" />
          <div className="content-stretch flex flex-col items-start relative shrink-0">
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-white tracking-[1.4px] uppercase whitespace-nowrap">
              <p className="leading-[20px]">Experience Purity</p>
            </div>
          </div>
        </div>

        {/* Mobile Subtitle */}
        <div className="absolute content-stretch flex flex-col items-center justify-center left-[32px] max-w-[512px] right-[207px] top-[564px]">
          <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white whitespace-nowrap">
            <p className="leading-[32.5px]">Natural spring water</p>
          </div>
        </div>

        {/* Mobile Hero Section Bottom Gradient Overlay */}
        <div className="absolute bg-gradient-to-b blur-[40px] from-[rgba(98,179,232,0.8)] h-[150px] left-0 opacity-70 to-[rgba(221,216,216,0.6)] top-[700px] w-[430px] z-0" />

        {/* Mobile CTA Buttons */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[8px] h-[136px] items-center justify-end left-1/2 pt-[16px] top-[675px] w-[430px] z-10">
          <button
            onClick={() => router.push('/products')}
            className="bg-[#31daff] content-stretch flex flex-col h-[60px] items-center justify-center pl-[63px] pr-[61px] py-[16px] relative rounded-[9999px] shrink-0 w-[185px] cursor-pointer"
          >
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">
              <p className="leading-[24px]">Shop Now</p>
            </div>
          </button>
          <button
            onClick={() => router.push('/about')}
            className="bg-[rgba(0,0,0,0)] content-stretch flex flex-col h-[60px] items-center justify-center px-[40px] py-[16px] relative rounded-[9999px] shrink-0 w-[368px] cursor-pointer"
          >
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[19px] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-[89px]">
              <p className="leading-[24px] whitespace-pre-wrap">Learn More</p>
            </div>
          </button>
        </div>

        {/* Mobile Bottom Navigation Frame */}
        <div className="-translate-x-1/2 absolute bg-[rgba(255,255,255,0.1)] h-[80px] left-1/2 overflow-clip rounded-[90px] top-[829px] w-[394px] z-50">
          <div className="-translate-y-1/2 absolute left-[6px] size-[56px] top-1/2">
            <img className="block max-w-none size-full" alt="" src={imgEllipse2} />
          </div>
          <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex items-center justify-center left-1/2 top-1/2 w-[348px]">
            <div className="content-stretch flex gap-[87px] items-center justify-center relative shrink-0 w-[252px]">
              <button onClick={() => router.push('/')} className="h-[21px] relative shrink-0 w-[19px]">
                <img className="block max-w-none size-full" alt="" src={imgVector} />
              </button>
              <button onClick={() => router.push('/cart')} className="block cursor-pointer h-[28px] relative shrink-0 w-[20px]">
                <img className="block max-w-none size-full" alt="" src={imgVector1} />
              </button>
              <button onClick={() => router.push('/profile')} className="block cursor-pointer h-[22.312px] relative shrink-0 w-[25px]">
                <img className="block max-w-none size-full" alt="" src={imgGroup2148} />
              </button>
              <button onClick={() => router.push('/contact')} className="block cursor-pointer h-[22px] relative shrink-0 w-[18.526px]">
                <img className="block max-w-none size-full" alt="" src={imgGroup2149} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Featured Products Gradient Overlay */}
        <div className="absolute bg-gradient-to-b blur-[30px] from-[#62b3e8] h-[200px] left-0 opacity-60 to-[rgba(221,216,216,0.4)] top-[850px] w-[430px] z-0" />

        {/* Mobile Featured Products Section */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[7px] h-[123px] items-center justify-center left-[calc(50%+0.5px)] top-[958px] w-full max-w-[429px] z-10">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[40px] relative shrink-0 text-[40px] text-center text-white tracking-[-0.9px] uppercase whitespace-nowrap">
              <p className="mb-0">FEATURED</p>
              <p>PRODUCTS</p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
              <p className="leading-[24px]">Premium water designed for modern living</p>
            </div>
          </div>
          <div className="bg-[#00d1ff] h-[5px] rounded-[30px] shrink-0 w-[90px]" />
        </div>

        {/* Mobile Featured Product Card */}
        {featuredProducts.length > 0 && (
          <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[40px] items-center left-[calc(50%+0.5px)] px-[16px] top-[1088px] w-[371px]">
            <div className="h-[435px] relative shrink-0 w-[155px]">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                  alt={featuredProducts[0].title}
                  className="absolute h-[110.66%] left-[-104.92%] max-w-none top-[-5.74%] w-[309.84%]"
                  src={featuredProducts[0].image || imgBorborAquaProductKids033L2}
                />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[6px] items-start py-px relative shrink-0 w-full">
              <div className="content-stretch flex h-[24px] items-end justify-between relative shrink-0 w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0">
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[28px] relative shrink-0 text-[18px] text-white whitespace-nowrap">
                      <p className="mb-0">{featuredProducts[0].title}</p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[12px] tracking-[1.2px] uppercase whitespace-nowrap">
                      <p className="leading-[16px]">0.5L</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0">
                  <div className="flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[20px] whitespace-nowrap">
                    <p className="leading-[28px]">{formatPrice(featuredProducts[0].price)}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleAddToCart(featuredProducts[0])}
                disabled={addingToCart.has(featuredProducts[0].id) || !featuredProducts[0].inStock}
                className="bg-[#00d1ff] content-stretch cursor-pointer flex h-[48px] items-center justify-center py-[12px] relative rounded-[34px] shrink-0 w-[339px] disabled:opacity-50"
              >
                <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
                  <p className="leading-[24px]">Add to Cart</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Carousel Navigation */}
        <div className="-translate-x-1/2 absolute content-stretch flex items-center justify-between left-[calc(50%+0.5px)] top-[1285px] w-[339px]">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
            <button
              onClick={handlePreviousProducts}
              className="bg-[rgba(0,0,0,0)] border-[0.5px] border-[rgba(255,255,255,0.49)] border-solid col-1 content-stretch flex flex-col items-center justify-center ml-0 mt-0 px-[8.5px] py-[6.5px] relative rounded-[9999px] row-1"
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
                className="bg-[rgba(0,0,0,0)] border-[0.5px] border-[rgba(255,255,255,0.49)] border-solid content-stretch flex flex-col items-center justify-center px-[8.5px] py-[6.5px] relative rounded-[9999px]"
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

        {/* Mobile Pagination Dots */}
        <div className="absolute contents left-1/2 top-[1666px]">
          <div className="absolute bg-white left-[calc(50%-17px)] rounded-[9999px] size-[6px] top-[1666px]" />
          <div className="absolute bg-[#00d1ff] h-[6px] left-1/2 rounded-[9999px] top-[1666px] w-[16px]" />
          <div className="absolute bg-white left-[calc(50%+17px)] rounded-[9999px] size-[6px] top-[1666px]" />
        </div>

        {/* Mobile View All Products Button */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center left-[calc(50%+1.5px)] top-[1708px] w-[241px]">
          <button
            onClick={() => router.push('/products')}
            className="border-2 border-[#e2e8f0] border-solid content-stretch flex gap-[8px] items-center px-[34px] py-[12px] relative rounded-[9999px] shrink-0"
          >
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[16px] text-center whitespace-nowrap">
              <p className="leading-[24px]">View All Products</p>
            </div>
            <div className="relative shrink-0">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative">
                <div className="flex items-center justify-center relative shrink-0">
                  <div className="-scale-y-100 flex-none">
                    <div className="h-[28px] relative w-[24.02px]">
                      <img alt="" className="block max-w-none size-full" src={img1} />
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
                <p className="leading-[40px] whitespace-pre-wrap">WATER ENERGY</p>
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

        {/* Mobile Water Energy Content */}
        <div className="-translate-x-1/2 absolute h-[465px] left-[calc(50%-10.5px)] top-[1900px] lg:top-[1895px] w-[403px]">
          <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[54.84%_0.99%_16.56%_68.49%] justify-center leading-[0] text-[#0f172a] text-[0px] tracking-[-0.9px] uppercase whitespace-nowrap">
            <p className="leading-[25px] mb-0 text-[29px]">Pure</p>
            <p className="leading-[25px] mb-0 text-[29px]">energy</p>
            <p className="font-['Montserrat:Regular',sans-serif] font-normal leading-[20px] mb-0 text-[14px]">drawn from</p>
            <p className="font-['Montserrat:Regular',sans-serif] font-normal leading-[20px] mb-0 text-[14px]">nature,</p>
            <p className="font-['Montserrat:Regular',sans-serif] font-normal leading-[20px] mb-0 text-[14px]">captured in</p>
            <p className="font-['Montserrat:Regular',sans-serif] font-normal leading-[20px] text-[14px]">every drop.</p>
          </div>
          <div className="absolute flex flex-col font-['Montserrat:Regular',sans-serif] font-normal inset-[22.8%_59.55%_60%_13.65%] justify-center leading-[16px] text-[#0f172a] text-[14px] text-right tracking-[-0.9px] uppercase whitespace-nowrap">
            <p className="mb-0">Crystal</p>
            <p className="mb-0">clarity that</p>
            <p className="mb-0">refreshes the</p>
            <p className="mb-0">body and</p>
            <p>restores</p>
          </div>
          <div className="absolute flex inset-[43.01%_56.32%_-14.63%_-38.96%] items-center justify-center">
            <div className="flex-none rotate-[47.15deg] size-[240px]">
              <div className="relative size-full">
                <div className="absolute backdrop-blur-[4px] bg-[rgba(141,44,221,0.3)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[120px]" />
                <div className="absolute inset-0 mix-blend-lighten">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img alt="" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
                  </div>
                </div>
                <div className="absolute bg-[rgba(141,44,221,0.6)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[120px]" />
              </div>
            </div>
          </div>
          <div className="absolute contents inset-[5.91%_9.77%_0.02%_3.97%]">
            <div className="absolute contents inset-[5.91%_9.77%_0.02%_16.13%]">
              <div className="absolute contents inset-[5.91%_9.77%_0.02%_16.13%]">
                <div className="absolute inset-[9.43%_9.77%_67.89%_72.21%]">
                  <div className="absolute inset-[0_3.7%_4.59%_0.78%]">
                    <img alt="" className="block max-w-none size-full" src={imgVector7} />
                  </div>
                </div>
                <div className="absolute inset-[48.32%_67.73%_31.94%_16.13%]">
                  <img alt="" className="block max-w-none size-full" src={imgVector8} />
                </div>
                <div className="absolute aspect-[157.45058065837884/437.4313836472372] flex items-center justify-center left-[34.21%] right-[26.72%] top-[27.48px]">
                  <div className="flex-none h-[436.107px] rotate-[-0.5deg] w-[153.651px]">
                    <div className="relative size-full">
                      <div className="absolute inset-0 opacity-88 overflow-hidden pointer-events-none">
                        <img alt="" className="absolute h-full left-[-91.91%] max-w-none top-0 w-[283.83%]" src={imgSqawdef1} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-[15.61%_15.04%_66.56%_63.72%]">
                  <div className="absolute inset-[-3.62%_-4.67%_-6.03%_-4.67%]">
                    <img alt="" className="block max-w-none size-full" src={imgGlass3} />
                  </div>
                </div>
                <div className="absolute inset-[54.8%_56.51%_27.38%_22.25%]">
                  <div className="absolute inset-[-3.62%_-4.67%_-6.03%_-4.67%]">
                    <img alt="" className="block max-w-none size-full" src={imgGlass4} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Black',sans-serif] font-black inset-[37.63%_59.55%_51.61%_3.97%] justify-center leading-[0] text-[#09c1ff] text-[29px] text-right tracking-[-0.9px] uppercase whitespace-nowrap">
              <p className="leading-[50px]">balance</p>
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
              <p className="mb-0">Pure</p>
              <p className="mb-0">spring</p>
              <p className="mb-0">water</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light mb-0">from</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light">Armenia</p>
            </div>
            <div className="absolute flex flex-col font-['Inter:Medium_Italic',sans-serif] font-medium inset-[84.65%_8.65%_6.46%_44.71%] italic justify-center leading-[0] text-[14px] text-right text-white">
              <p className="leading-[24px] whitespace-pre-wrap">Natura Source</p>
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
              <p className="mb-0">BALNCED</p>
              <p className="mb-0">HYDRATION</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light mb-0">EVERY</p>
              <p className="font-['Montserrat:Light',sans-serif] font-light">DAY</p>
            </div>
            <div className="absolute flex flex-col font-['Inter:Medium_Italic',sans-serif] font-medium inset-[84.65%_8.65%_6.46%_44.71%] italic justify-center leading-[0] text-[#1ac0fd] text-[14px] text-right">
              <p className="leading-[24px] whitespace-pre-wrap">Clean Minrals</p>
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
                <p className="leading-[40px] whitespace-pre-wrap">WHY CHOOSE US</p>
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
        <div className="absolute content-stretch flex flex-col gap-[50px] items-end left-[35px] top-[3210px] w-[361px]">
          <div className="h-[286px] relative shrink-0 w-full">
            <div className="absolute bg-white inset-[18.18%_0_0_0] rounded-[37px]" />
            <div className="absolute aspect-[100/100] left-[33.98%] right-[33.7%] top-0">
              <div className="relative size-full">
                <div className="absolute inset-[9.48%_-14.22%_18.97%_34.91%]">
                  <img alt="" className="block max-w-none size-full" src={imgVector4} />
                </div>
                <div className="absolute inset-[29.31%_16.81%_0_9.91%]">
                  <div className="absolute inset-[-3.66%_-4.71%_-6.1%_-4.71%]">
                    <img alt="" className="block max-w-none size-full" src={imgGlass2} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal inset-[61.19%_11.7%_22.03%_11.98%] justify-center leading-[24px] not-italic text-[#64748b] text-[16px] text-center whitespace-pre-wrap">
              <p className="mb-0">Rich in Natural Minerals that provide</p>
              <p>valuable health benefits.</p>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Bold',sans-serif] font-bold inset-[49.3%_22.56%_40.91%_22.84%] justify-center leading-[0] text-[#0f172a] text-[20px] text-center uppercase">
              <p className="leading-[28px] whitespace-pre-wrap">RICH IN MINERALS</p>
            </div>
          </div>
          <div className="h-[278px] relative shrink-0 w-full">
            <div className="absolute bg-white inset-[15.83%_0_0_0] rounded-[37px]" />
            <div className="absolute aspect-[100/100] left-[33.52%] right-[34.08%] top-0">
              <div className="relative size-full">
                <div className="absolute inset-[5.88%_-4.86%_26.15%_50.33%]">
                  <img alt="" className="block max-w-none size-full" src={imgGroup} />
                </div>
                <div className="absolute inset-[13.93%_8.94%_9.09%_8.94%]">
                  <div className="absolute inset-[-3.36%_-4.2%_-5.6%_-4.2%]">
                    <img alt="" className="block max-w-none size-full" src={imgGlass1} />
                  </div>
                </div>
                <div className="absolute inset-[39.77%_45.45%_20.45%_45.45%]">
                  <img alt="" className="block max-w-none size-full" src={imgTop1} />
                </div>
              </div>
            </div>
            <div className="absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal inset-[60.07%_8.94%_22.66%_8.38%] justify-center leading-[24px] not-italic text-[#64748b] text-[16px] text-center whitespace-pre-wrap">
              <p className="mb-0">Borbor Aqua does not include any</p>
              <p>artificial ingredients in its bottled water</p>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Bold',sans-serif] font-bold inset-[47.84%_9.5%_42.09%_8.94%] justify-center leading-[0] text-[#0f172a] text-[20px] text-center uppercase">
              <p className="leading-[28px] whitespace-pre-wrap">no artifical ingridients</p>
            </div>
          </div>
          <div className="h-[272px] relative shrink-0 w-full">
            <div className="absolute bg-white inset-[13.97%_-0.55%_0_0] rounded-[37px]" />
            <div className="absolute aspect-[100/100] left-[34.07%] overflow-clip right-[33.8%] top-0">
              <div className="relative size-full">
                <div className="absolute inset-[10.22%_10.23%_61.04%_62.5%]">
                  <img alt="" className="block max-w-none size-full" src={imgBg} />
                </div>
                <div className="absolute inset-[16.22%_15.91%_6.5%_4.41%]">
                  <div className="absolute inset-[-3.35%_-4.33%_-5.58%_-4.33%]">
                    <img alt="" className="block max-w-none size-full" src={imgGlass} />
                  </div>
                </div>
                <div className="absolute inset-[32.96%_31.82%_25.5%_35.23%]">
                  <img alt="" className="block max-w-none size-full" src={imgTop} />
                </div>
              </div>
            </div>
            <div className="absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal inset-[60.66%_11.91%_24.63%_12.19%] justify-center leading-[20px] not-italic text-[#64748b] text-[16px] text-center whitespace-nowrap">
              <p className="mb-0">Borbor Aqua does not infuse carbon</p>
              <p>dioxide in any of its bottled water.</p>
            </div>
            <div className="absolute flex flex-col font-['Montserrat:Bold',sans-serif] font-bold inset-[46.69%_21.05%_43.01%_21.61%] justify-center leading-[0] text-[#0f172a] text-[20px] text-center uppercase whitespace-nowrap">
              <p className="leading-[28px]">NON-CARBONATED</p>
            </div>
          </div>
        </div>

        {/* Mobile Trusted By Section */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[9px] items-center justify-center left-[calc(50%+0.5px)] top-[4227px] w-full max-w-[429px]">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[40px] text-center tracking-[-0.9px] uppercase w-full">
                <p className="leading-[40px] whitespace-pre-wrap">TRUSTED BY</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[14px] text-center uppercase whitespace-nowrap">
            <p className="leading-[16px]">Industry leading partners</p>
          </div>
          <div className="flex items-center justify-center relative shrink-0 w-full">
            <div className="-scale-y-100 flex-none w-full">
              <div className="content-stretch flex h-[9px] items-start justify-center relative w-full">
                <div className="bg-[#00d1ff] h-[5px] rounded-[30px] shrink-0 w-[90px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Trusted By Logo */}
        <div className="-translate-x-1/2 absolute content-stretch flex items-center left-[calc(50%+9px)] top-[4360px]">
          <div className="h-[68.253px] relative shrink-0 w-[246px]">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgLogo1} />
          </div>
        </div>

        {/* Mobile Trusted By Navigation */}
        <div className="-translate-x-1/2 absolute content-stretch flex h-[41px] items-center justify-between left-[calc(50%+8.5px)] top-[4374px] w-[377px]">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
            <button
              onClick={handlePreviousTrustedBy}
              className="bg-[rgba(0,0,0,0)] border-[#eee] border-[0.5px] border-solid col-1 content-stretch flex flex-col items-center justify-center ml-0 mt-0 px-[8.5px] py-[6.5px] relative rounded-[9999px] row-1"
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
                className="bg-[rgba(0,0,0,0)] border-[#eee] border-[0.5px] border-solid content-stretch flex flex-col items-center justify-center px-[8.5px] py-[6.5px] relative rounded-[9999px]"
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

        {/* Mobile Footer */}
        <div className="absolute content-stretch flex flex-col gap-[30px] items-start justify-center left-[35px] top-[4669px] w-[339px] pb-[0px]">
          <div className="h-[312px] relative shrink-0 w-full">
            <div className="absolute content-stretch flex h-[34px] items-center left-0 top-0 w-[336px]">
              <div className="h-[34px] relative shrink-0 w-[112px]">
                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBorborAguaLogoColorB2024Colored1} />
              </div>
            </div>
            <div className="absolute content-stretch flex flex-col items-start left-0 top-[58px] w-[336px]">
              <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-full">
                <p className="leading-[26px] whitespace-pre-wrap">New Aqua LLC introduces its Natural Spring Bottled Water – Borbor Aqua. Our range of products consists of 0.25L, 0.33L, 0.5L, 1L, 5L & 19L water bottles. Our Natural spring bottled water is non-carbonated. It is Rich in Natural Minerals that provides valuable health benefits to everyone.</p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[4px] h-[165px] items-start relative shrink-0 w-full">
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
        <div className="-translate-x-1/2 absolute border-[#e2e8f0] border-solid border-t content-stretch flex flex-col gap-[21px] items-center justify-center left-1/2 pt-[29px] top-[5650px] w-[386px] z-10">
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

      {/* Desktop Version - Hidden on mobile */}
      <div
        ref={containerRef}
        className="hidden md:block bg-white relative w-full max-w-[1440px] mx-auto h-[6901px] lg:h-[6901px] md:h-[5600px] home-page-container"
      >
      {/* Header Section - Navigation Bar */}
      <div className="fixed bg-[rgba(255,255,255,0.08)] backdrop-blur-[15px] content-stretch flex flex-col h-[73px] md:h-[60px] sm:h-[50px] items-center justify-center left-1/2 px-[38px] md:px-[24px] sm:px-[16px] py-[16px] md:py-[12px] sm:py-[8px] rounded-[70px] md:rounded-[50px] sm:rounded-[40px] top-[64px] md:top-[32px] sm:top-[16px] translate-x-[-50%] w-[1400px] lg:w-[1400px] md:w-[90%] sm:w-[95%] z-50 border border-[rgba(255,255,255,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_60px_rgba(98,179,232,0.15)]">
        <div className="content-stretch flex gap-[200px] lg:gap-[200px] md:gap-[120px] sm:gap-[16px] h-[56px] md:h-[44px] sm:h-[36px] items-center justify-center relative shrink-0">
          {/* Logo */}
          <div
            onClick={() => router.push('/')}
            className="h-[31px] md:h-[26px] sm:h-[22px] relative shrink-0 w-[101px] md:w-[85px] sm:w-[72px] cursor-pointer"
          >
            <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgBorborAguaLogoColorB2024Colored1} />
          </div>

          {/* Navigation Menu */}
          <div className="content-stretch flex font-['Inter:Bold',sans-serif] font-bold gap-[74px] lg:gap-[74px] md:gap-[24px] sm:gap-[12px] items-end justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-white uppercase whitespace-nowrap sm:hidden md:flex">
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
              onClick={() => router.push('/contact')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">{t('home.navigation.contactUs')}</p>
            </div>
            <div
              onClick={() => router.push('/blog')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">{t('home.navigation.blog')}</p>
            </div>
          </div>

          {/* Header Icons - Separate Vector Groups */}
          <div className="content-stretch flex gap-[36px] lg:gap-[36px] md:gap-[20px] sm:gap-[12px] items-center justify-center relative shrink-0">
            {/* Search Icon */}
            <div
              onClick={() => setShowSearchModal(true)}
              className="h-[21px] md:h-[18px] sm:h-[16px] w-[21px] md:w-[18px] sm:w-[16px] relative shrink-0 cursor-pointer flex items-center justify-center"
            >
              <SearchIcon size={21} />
            </div>

            {/* Cart Icon */}
            <div
              onClick={() => router.push('/cart')}
              className="h-[20px] md:h-[18px] sm:h-[16px] w-[20px] md:w-[18px] sm:w-[16px] relative shrink-0 cursor-pointer flex items-center justify-center"
            >
              <HeaderCartIcon size={20} />
            </div>

            {/* Language Icon */}
            <div className="relative shrink-0" ref={languageMenuRef}>
              <div
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="h-[20px] md:h-[18px] sm:h-[16px] w-[20px] md:w-[18px] sm:w-[16px] relative cursor-pointer flex items-center justify-center"
              >
                <LanguageIcon size={20} />
              </div>
              {showLanguageMenu && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {Object.entries(LANGUAGES).map(([code, lang]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code as LanguageCode)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 ${getStoredLanguage() === code
                          ? 'bg-gray-100 text-gray-900 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Exit/Logout Icon with User Menu */}
            {isLoggedIn ? (
              <div className="relative shrink-0" ref={userMenuRef}>
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-[20px] md:h-[18px] sm:h-[16px] w-[20px] md:w-[18px] sm:w-[16px] relative cursor-pointer flex items-center justify-center"
                >
                  <ExitIcon size={20} />
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
                      Profile
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          router.push('/admin');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150"
                      >
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-150"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => router.push('/login')}
                className="h-[20px] md:h-[18px] sm:h-[16px] w-[20px] md:w-[18px] sm:w-[16px] relative shrink-0 cursor-pointer flex items-center justify-center"
              >
                <ExitIcon size={20} />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Background Gradient */}
      <div className="absolute bg-gradient-to-b blur-[50px] from-[#62b3e8] h-[1075px] left-1/2 to-[rgba(221,216,216,0.75)] top-0 translate-x-[-50%] w-full max-w-[1920px]" />

      {/* Hero Section Decorative Group */}
      <div className="absolute inset-[3.74%_14.27%_90%_14.64%]">
        <img alt="Decorative Group" className="block max-w-none size-full figma-fade-in" src={imgGroup2105} />

      </div>

      {/* Image 13 - Decorative Element */}
      <div className="absolute flex items-center justify-center left-[600px] top-[410px] size-[806px] pointer-events-none">
        <div className="relative rounded-[320px] size-full">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Image 13" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]"  />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
        </div>
      </div>

      {/* Hero Section - Main Content */}
      <div className="absolute content-stretch flex items-end justify-center left-[calc(50%+0.5px)] px-[24px] md:px-[16px] sm:px-[12px] top-[528px] lg:top-[528px] md:top-[400px] sm:top-[280px] translate-x-[-50%] w-[900px] lg:w-[900px] md:w-[90%] sm:w-[95%]">
        <div className="content-stretch flex flex-col gap-[24px] lg:gap-[24px] md:gap-[20px] sm:gap-[16px] items-center justify-center relative shrink-0 w-[900px] lg:w-[900px] md:w-full sm:w-full">
          {/* Experience Purity Label */}
          <div className="content-stretch flex gap-[12px] lg:gap-[12px] md:gap-[10px] sm:gap-[8px] items-center relative shrink-0 w-full">
            <div className="bg-white h-[2px] lg:h-[2px] md:h-[1.5px] sm:h-[1.5px] shrink-0 w-[48px] lg:w-[48px] md:w-[40px] sm:w-[32px]" />
            <div className="content-stretch flex flex-col items-start relative shrink-0">
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[12px] sm:text-[11px] text-white tracking-[1.4px] lg:tracking-[1.4px] md:tracking-[1.2px] sm:tracking-[1px] uppercase whitespace-nowrap">
                <p className="leading-[20px] lg:leading-[20px] md:leading-[18px] sm:leading-[16px]">{t('home.hero.experiencePurity')}</p>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[96px] lg:text-[96px] md:text-[64px] sm:text-[36px] text-center text-white w-full">
              <p className="whitespace-pre-wrap">
                <span className="leading-[96px] lg:leading-[96px] md:leading-[64px] sm:leading-[40px] text-white font-black">{t('home.hero.yourDailyDoseOf')} </span>
                <span className="font-['Montserrat',sans-serif] font-light leading-[96px] lg:leading-[96px] md:leading-[64px] sm:leading-[40px] text-white"> </span>
                <span className="leading-[96px] lg:leading-[96px] md:leading-[64px] sm:leading-[40px]"> </span>
                <span className="leading-[96px] lg:leading-[96px] md:leading-[64px] sm:leading-[40px] text-white font-black">{t('home.hero.freshness')}</span>
              </p>
            </div>
          </div>

          {/* Subtitle */}
          <div className="content-stretch flex flex-col items-center justify-center max-w-[512px] lg:max-w-[512px] md:max-w-[400px] sm:max-w-[280px] relative shrink-0 w-[512px] lg:w-[512px] md:w-full sm:w-full">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[20px] lg:text-[20px] md:text-[18px] sm:text-[14px] text-white whitespace-nowrap">
              <p className="leading-[32.5px] lg:leading-[32.5px] md:leading-[28px] sm:leading-[22px]">{t('home.hero.subtitle')}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="content-center flex flex-wrap gap-[0px_16px] lg:gap-[0px_16px] md:gap-[0px_12px] sm:gap-[0px_8px] h-[76px] lg:h-[76px] md:h-[64px] sm:h-[56px] items-center justify-center pt-[16px] lg:pt-[16px] md:pt-[12px] sm:pt-[8px] relative shrink-0 w-full">
            <div
              onClick={() => router.push('/products')}
              className="bg-[#1ac0fd] content-stretch flex flex-col h-[60px] lg:h-[60px] md:h-[52px] sm:h-[44px] items-center justify-center pl-[63px] pr-[61px] lg:pl-[63px] lg:pr-[61px] md:pl-[48px] md:pr-[46px] sm:pl-[32px] sm:pr-[30px] py-[16px] lg:py-[16px] md:py-[12px] sm:py-[10px] relative rounded-[9999px] shrink-0 w-[185px] lg:w-[185px] md:w-[160px] sm:w-[140px] cursor-pointer hover:bg-[#00b8e6] transition-colors"
            >
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-white whitespace-nowrap">
                <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">{t('home.hero.shopNow')}</p>
              </div>
            </div>
            <div
              onClick={() => router.push('/about')}
              className="bg-[rgba(0,0,0,0)] content-stretch flex flex-col h-[60px] lg:h-[60px] md:h-[52px] sm:h-[44px] items-center justify-center px-[40px] lg:px-[40px] md:px-[32px] sm:px-[24px] py-[16px] lg:py-[16px] md:py-[12px] sm:py-[10px] relative rounded-[9999px] shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[19px] lg:h-[19px] md:h-[17px] sm:h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-white w-[89px] lg:w-[89px] md:w-[75px] sm:w-[65px]">
                <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px] whitespace-pre-wrap">{t('home.hero.learnMore')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Water Wave Graphic */}
      <div className="absolute h-[807px] left-0 top-[1158px] w-full max-w-[1920px] z-[-1]">
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

      <div className="absolute h-[1051px] left-1/2 top-[4650px] translate-x-[-50%] w-[2808px] overflow-hidden "  >
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
        <div className="flex-none rotate-[-56.31deg] figma-rotate-slow">
          <div className="relative size-[753.698px]">
            <img alt="Shape" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
      </div>

      <div className="absolute flex items-center justify-center left-[calc(50%+119.2px)] size-[956.401px] top-[5477px] translate-x-[-50%]">
        <div className="flex-none rotate-[-16.26deg] scale-y-[-100%] figma-rotate-slow">
          <div className="relative size-[524.132px]">
            <img alt="Shape" className="block max-w-none size-full" src={imgShape2} />
            {/* White background overlay with gradient for bottom section */}
            <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-white to-transparent pointer-events-none rounded-[40px] overflow-hidden"></div>

          </div>
        </div>
      </div>

      <div className="absolute flex items-center justify-center left-[calc(50%-587.04px)] size-[641.928px] top-[3208px] translate-x-[-50%]">
        <div className="flex-none rotate-[-165deg] figma-rotate-slow">
          <div className="relative size-[524.132px]">
            <img alt="Shape" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
      </div>

      <div className="absolute flex items-center justify-center left-[calc(50%-1082.68px)] size-[944.637px] top-[3493px] translate-x-[-50%]">
        <div className="flex-none rotate-[-165deg] figma-rotate-slow">
          <div className="relative size-[771.293px]">
            <img alt="Shape" className="block max-w-none size-full" src={imgShape3} />
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="absolute h-[1175px] lg:h-[1175px] md:h-[900px] sm:h-[700px] left-1/2 top-[1278px] lg:top-[1278px] md:top-[1000px] sm:top-[800px] translate-x-[-50%] w-full max-w-[1920px] overflow-hidden">
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
        <div className="absolute h-[976px] lg:h-[976px] md:h-[750px] sm:h-[600px] left-1/2 translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%] top-[179px] lg:top-[179px] md:top-[130px] sm:top-[100px] relative z-10">
          {/* Section Header */}
          <div className="absolute content-stretch flex flex-col gap-[16px] lg:gap-[16px] md:gap-[12px] sm:gap-[10px] items-start left-0 lg:left-0 md:left-[16px] sm:left-[12px] right-0 lg:right-0 md:right-[16px] sm:right-[12px] top-[10px] lg:top-[10px] md:top-[0px] sm:top-[0px]">
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[70px] lg:text-[70px] md:text-[48px] sm:text-[32px] text-center text-white tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
                <p className="leading-[40px] lg:leading-[40px] md:leading-[32px] sm:leading-[28px]">{t('home.featuredProducts.title')}</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full mt-[18px] lg:mt-[18px]">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center text-white whitespace-nowrap">
                <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">{t('home.featuredProducts.subtitle')}</p>
              </div>
            </div>
          </div>


          

          {/* Products Grid - Uniform Layout */}
          <div className="absolute h-[442px] lg:h-[442px] md:h-[330px] sm:h-[270px] left-0 lg:left-0 md:left-[16px] sm:left-[12px] right-0 lg:right-0 md:right-[16px] sm:right-[12px] top-[206px] lg:top-[206px] md:top-[150px] sm:top-[120px] z-[10]">
            {productsLoading ? (
              // Loading state - show placeholder with uniform grid
              <div className="flex gap-[40px] lg:gap-[40px] md:gap-[30px] sm:gap-[20px] justify-center items-start h-full">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-[24px] w-[320px] lg:w-[320px] md:w-[280px] sm:w-[240px] bg-transparent">
                    <div className="h-[320px] lg:h-[320px] md:h-[280px] sm:h-[240px] w-full bg-gray-300 animate-pulse rounded-lg overflow-hidden" />
                    <div className="w-full flex flex-col gap-[16px] px-[16px]">
                      <div className="h-4 bg-gray-300 animate-pulse rounded w-3/4" />
                      <div className="h-6 bg-gray-300 animate-pulse rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              // Render actual products - show 3 at a time based on carouselIndex with uniform grid
              <div className="flex gap-[40px] lg:gap-[40px] md:gap-[30px] sm:gap-[20px] justify-center items-start h-full">
                {(() => {
                  const visibleProducts = featuredProducts.slice(carouselIndex, carouselIndex + 3);
                  return visibleProducts.map((product) => {
                    const currency = getStoredCurrency();
                    const formattedPrice = formatPrice(product.price, currency);

                    return (
                      <div
                        key={product.id}
                        onClick={() => router.push(`/products/${product.slug}`)}
                        className="flex flex-col items-center gap-[24px] w-[320px] lg:w-[320px] md:w-[280px] sm:w-[240px] cursor-pointer product-card-hover z-[11] isolate bg-transparent"
                      >
                        {/* Image Container - Uniform size with overflow hidden */}
                        <div className="h-[320px] lg:h-[320px] md:h-[280px] sm:h-[240px] w-full relative overflow-hidden flex items-center justify-center bg-transparent">
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
                        <div className="w-full flex flex-col gap-[16px] px-[16px] pb-[16px]">
                          <div className="flex items-end justify-between w-full">
                            <div className="flex flex-col items-start">
                              <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white">
                                <p className="leading-[28px] lg:leading-[28px] md:leading-[24px] sm:leading-[20px]">{product.title}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-start">
                              <div className="flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[20px] lg:text-[20px] md:text-[18px] sm:text-[16px] whitespace-nowrap">
                                <p className="leading-[28px] lg:leading-[28px] md:leading-[24px] sm:leading-[20px]">{formattedPrice}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            disabled={!product.inStock || addingToCart.has(product.id)}
                            className="bg-[#00d1ff] content-stretch flex h-[48px] items-center justify-center py-[12px] relative rounded-[34px] shrink-0 w-full hover:bg-[#00b8e6] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center text-white whitespace-nowrap">
                              <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">
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
                aria-label="Show first 3 products"
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
                aria-label="Show second 3 products"
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
                aria-label="Show third 3 products"
              />
            </div>
          )}

          {/* View All Products Button */}
          <div className="absolute content-stretch flex flex-col items-center left-[24px] lg:left-[24px] md:left-[16px] sm:left-[12px] right-[24px] lg:right-[24px] md:right-[16px] sm:right-[12px] top-[806px] lg:top-[806px] md:top-[580px] sm:top-[430px]">
            <div
              onClick={() => router.push('/products')}
              className="border-2 border-[#e2e8f0] border-solid content-stretch flex gap-[8px] lg:gap-[8px] md:gap-[6px] sm:gap-[4px] items-center px-[34px] lg:px-[34px] md:px-[28px] sm:px-[20px] py-[12px] lg:py-[12px] md:py-[10px] sm:py-[8px] relative rounded-[9999px] shrink-0 cursor-pointer hover:border-[#00d1ff] hover:bg-[#00d1ff]/5 transition-all"
            >
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center whitespace-nowrap">
                <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">{t('home.featuredProducts.viewAllProducts')}</p>
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
          <div className="absolute content-stretch flex items-start justify-center left-1/2 top-[110px] translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%]">
            <div className="bg-[#00d1ff] h-[5px] rounded-[30px] shrink-0 w-[90px]" />
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
            className="absolute bg-transparent border-[0.5px] border-white/49 border-solid flex items-center justify-center px-[8.5px] py-[6.5px] rounded-full size-[56px] lg:size-[56px] md:size-[48px] sm:size-[40px] cursor-pointer hover:bg-white/20 hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:bg-white/30 active:scale-95 transition-all duration-200 z-[10001] group left-[calc(50%-650px)] lg:left-[calc(50%-650px)] md:left-[calc(50%-500px)] sm:left-[calc(50%-400px)] top-[1740px] lg:top-[1740px] md:top-[1350px] sm:top-[1090px]"
            aria-label="Next products"
          >
            <svg
              preserveAspectRatio="none"
              width="24.02"
              height="28"
              viewBox="0 0 24.02 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-[28px] lg:h-[28px] md:h-[24px] sm:h-[20px] w-[24.02px] lg:w-[24.02px] md:w-[20px] sm:w-[18px] transform rotate-180 scale-y-[-1] group-hover:scale-y-[-1.1] transition-transform duration-200 pointer-events-none"
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
            className="absolute bg-transparent border-[0.5px] border-white/49 border-solid flex items-center justify-center px-[8.5px] py-[6.5px] rounded-full size-[56px] lg:size-[56px] md:size-[48px] sm:size-[40px] cursor-pointer hover:bg-white/20 hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:bg-white/30 active:scale-95 transition-all duration-200 z-[10001] group right-[calc(50%-650px)] lg:right-[calc(50%-650px)] md:right-[calc(50%-500px)] sm:right-[calc(50%-400px)] top-[1740px] lg:top-[1740px] md:top-[1350px] sm:top-[1110px]"
            aria-label="Previous products"
          >
            <svg
              preserveAspectRatio="none"
              width="24.02"
              height="28"
              viewBox="0 0 24.02 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-[28px] lg:h-[28px] md:h-[24px] sm:h-[20px] w-[24.02px] lg:w-[24.02px] md:w-[20px] sm:w-[18px] transform scale-y-[-1] group-hover:scale-y-[-1.1] transition-transform duration-200 pointer-events-none"
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

      {/* Water Energy Section */}
      <div className="absolute content-stretch flex flex-col gap-[35px] lg:gap-[35px] md:gap-[28px] sm:gap-[20px] items-start left-1/2 top-[2606px] lg:top-[2606px] md:top-[2000px] sm:top-[1600px] translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%]">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[70px] lg:text-[70px] md:text-[48px] sm:text-[32px] text-center tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase w-[641px] lg:w-[641px] md:w-[500px] sm:w-full">
              <p className="leading-[40px] lg:leading-[40px] md:leading-[32px] sm:leading-[28px] whitespace-pre-wrap">{t('home.waterEnergy.title')}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center relative shrink-0 w-full">
          <div className="flex-none scale-y-[-100%] w-full">
            <div className="content-stretch flex h-[9px] items-start justify-center relative w-full">
              <div className="bg-[#00d1ff] h-[5px] rounded-[30px] shrink-0 w-[90px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Pure Spring Water / Balanced Hydration Cards */}
      {/* Blue Card (98%) */}
      <div className="absolute h-[343px] lg:h-[343px] md:h-[280px] sm:h-[240px] left-[729px] lg:left-[729px] md:left-[38%] sm:left-[5%] top-[3570px] lg:top-[3570px] md:top-[2800px] sm:top-[2200px] w-[794px] lg:w-[794px] md:w-[60%] sm:w-[90%]">
        <div className="absolute bg-[#1ac0fd] inset-0 rounded-[37px] lg:rounded-[37px] md:rounded-[30px] sm:rounded-[24px]" />
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[65.89%_3.9%_22.45%_69.14%] lg:inset-[65.89%_3.9%_22.45%_69.14%] md:inset-[65.89%_3.9%_22.45%_69.14%] sm:inset-[65.89%_3.9%_22.45%_69.14%] justify-center leading-[0] text-[96px] lg:text-[96px] md:text-[72px] sm:text-[56px] text-center text-white tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
          <p className="leading-[40px] lg:leading-[40px] md:leading-[32px] sm:leading-[28px]">{t('home.cards.pureSpringWater.percentage')}</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[12.83%_29.35%_58.02%_5.29%] lg:inset-[12.83%_29.35%_58.02%_5.29%] md:inset-[12.83%_29.35%_58.02%_5.29%] sm:inset-[12.83%_29.35%_58.02%_5.29%] justify-center leading-[50px] lg:leading-[50px] md:leading-[40px] sm:leading-[32px] text-[46px] lg:text-[46px] md:text-[36px] sm:text-[28px] text-white tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
          <p className="mb-0">{t('home.cards.pureSpringWater.title')}</p>
          <p className="font-['Montserrat',sans-serif] font-light">{t('home.cards.pureSpringWater.subtitle')}</p>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-medium inset-[83.67%_3.9%_9.33%_82.24%] lg:inset-[83.67%_3.9%_9.33%_82.24%] md:inset-[83.67%_3.9%_9.33%_82.24%] sm:inset-[83.67%_3.9%_9.33%_82.24%] italic justify-center leading-[0] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center text-white whitespace-nowrap">
          <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">{t('home.cards.pureSpringWater.source')}</p>
        </div>
      </div>

      {/* White Card (100%) */}
      <div className="absolute h-[343px] lg:h-[343px] md:h-[280px] sm:h-[240px] left-[393px] lg:left-[393px] md:left-[20.5%] sm:left-[5%] top-[3931px] lg:top-[3931px] md:top-[3100px] sm:top-[2500px] w-[795px] lg:w-[795px] md:w-[60%] sm:w-[90%]">
        <div className="absolute bg-white inset-0 rounded-[37px] lg:rounded-[37px] md:rounded-[30px] sm:rounded-[24px] shadow-[0_20px_60px_rgba(15,23,42,0.20)]" />
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[69.68%_60%_18.66%_7.42%] lg:inset-[69.68%_60%_18.66%_7.42%] md:inset-[69.68%_60%_18.66%_7.42%] sm:inset-[69.68%_60%_18.66%_7.42%] justify-center leading-[0] text-[#0f172a] text-[96px] lg:text-[96px] md:text-[72px] sm:text-[56px] text-center tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
          <p className="leading-[40px] lg:leading-[40px] md:leading-[32px] sm:leading-[28px]">{t('home.cards.balancedHydration.percentage')}</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[12.83%_5.28%_58.02%_22.26%] lg:inset-[12.83%_5.28%_58.02%_22.26%] md:inset-[12.83%_5.28%_58.02%_22.26%] sm:inset-[12.83%_5.28%_58.02%_22.26%] justify-center leading-[50px] lg:leading-[50px] md:leading-[40px] sm:leading-[32px] text-[#00d1ff] text-[46px] lg:text-[46px] md:text-[36px] sm:text-[28px] text-right tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
          <p className="mb-0">{t('home.cards.balancedHydration.title')}</p>
          <p className="font-['Montserrat',sans-serif] font-light">{t('home.cards.balancedHydration.subtitle')}</p>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-medium inset-[53.94%_78.24%_39.07%_7.42%] lg:inset-[53.94%_78.24%_39.07%_7.42%] md:inset-[53.94%_78.24%_39.07%_7.42%] sm:inset-[53.94%_78.24%_39.07%_7.42%] italic justify-center leading-[0] text-[#00d1ff] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center whitespace-nowrap">
          <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">{t('home.cards.balancedHydration.source')}</p>
        </div>
      </div>

      {/* Side Images */}
      <div className="absolute h-[343px] lg:h-[343px] md:h-[280px] sm:h-[240px] left-[393px] lg:left-[393px] md:left-[20.5%] sm:left-[5%] top-[3570px] lg:top-[3570px] md:top-[2800px] sm:top-[2200px] w-[306px] lg:w-[306px] md:w-[25%] sm:w-[40%]">
        <div className="absolute inset-0 rounded-[37px] lg:rounded-[37px] md:rounded-[30px] sm:rounded-[24px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[37px] lg:rounded-[37px] md:rounded-[30px] sm:rounded-[24px]">
            <img alt="Screenshot" className="absolute h-[149.05%] left-[-32.81%] max-w-none top-[-32.36%] w-[132.81%]" src={img5} />
          </div>
        </div>
      </div>

      <div className="absolute h-[350px] lg:h-[350px] md:h-[280px] sm:h-[240px] left-[1215px] lg:left-[1215px] md:left-[63.3%] sm:left-[55%] top-[3924px] lg:top-[3924px] md:top-[3100px] sm:top-[2500px] w-[308px] lg:w-[308px] md:w-[25%] sm:w-[40%]">
        <div className="absolute inset-0 rounded-[37px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[37px]">
            <img alt="Screenshot" className="absolute h-[101.64%] left-[-6.77%] max-w-none top-[-1.52%] w-[113.53%]" src={img6} />
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="absolute content-stretch flex flex-col gap-[32px] lg:gap-[32px] md:gap-[24px] sm:gap-[20px] items-start left-1/2 translate-x-[-50%] top-[4422px] lg:top-[4422px] md:top-[3500px] sm:top-[2800px] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%]">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[70px] lg:text-[70px] md:text-[48px] sm:text-[32px] text-center tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
              <p className="leading-[40px] lg:leading-[40px] md:leading-[32px] sm:leading-[28px]">{t('home.whyChooseUs.title')}</p>
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-start justify-center relative shrink-0 w-full">
          <div className="bg-[#00d1ff] h-[5px] rounded-[30px] shrink-0 w-[90px]" />
        </div>
      </div>

      {/* Why Choose Us Cards */}
      {/* Card 1: Rich in Minerals */}
      <div className="absolute h-[286px] lg:h-[286px] md:h-[240px] sm:h-[220px] left-1/2 translate-x-[-50%] top-[4661px] lg:top-[4661px] md:top-[3700px] sm:top-[3000px] w-[375px] lg:w-[375px] md:w-[45%] sm:w-[90%]">
        <div className="absolute bg-white inset-[18.18%_0_0_0] rounded-[37px]" />
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
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[61.19%_13.33%_22.03%_13.6%] lg:inset-[61.19%_13.33%_22.03%_13.6%] md:inset-[61.19%_13.33%_22.03%_13.6%] sm:inset-[61.19%_13.33%_22.03%_13.6%] justify-center leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px] not-italic text-[#64748b] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center">
          <p className="mb-0">{t('home.whyChooseUs.richInMinerals.description')}</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[49.3%_24%_40.91%_23.73%] lg:inset-[49.3%_24%_40.91%_23.73%] md:inset-[49.3%_24%_40.91%_23.73%] sm:inset-[49.3%_24%_40.91%_23.73%] justify-center leading-[0] text-[#0f172a] text-[20px] lg:text-[20px] md:text-[18px] sm:text-[16px] text-center uppercase whitespace-nowrap">
          <p className="leading-[28px] lg:leading-[28px] md:leading-[24px] sm:leading-[20px]">{t('home.whyChooseUs.richInMinerals.title')}</p>
        </div>
      </div>

      {/* Card 2: Non-Carbonated */}
      <div className="absolute h-[272px] lg:h-[272px] md:h-[240px] sm:h-[220px] left-1/2 translate-x-[-50%] lg:translate-x-[-774px] md:translate-x-[-50%] sm:translate-x-[-50%] top-[5086px] lg:top-[5086px] md:top-[4000px] sm:top-[3280px] w-[375px] lg:w-[375px] md:w-[45%] sm:w-[90%]">
        <div className="absolute bg-white inset-[13.97%_0_0_0] rounded-[37px]" />
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
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[60.66%_13.33%_24.63%_13.6%] lg:inset-[60.66%_13.33%_24.63%_13.6%] md:inset-[60.66%_13.33%_24.63%_13.6%] sm:inset-[60.66%_13.33%_24.63%_13.6%] justify-center leading-[20px] lg:leading-[20px] md:leading-[18px] sm:leading-[16px] not-italic text-[#64748b] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center">
          <p className="mb-0">{t('home.whyChooseUs.nonCarbonated.description')}</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[46.69%_22.4%_43.01%_22.4%] lg:inset-[46.69%_22.4%_43.01%_22.4%] md:inset-[46.69%_22.4%_43.01%_22.4%] sm:inset-[46.69%_22.4%_43.01%_22.4%] justify-center leading-[0] text-[#0f172a] text-[20px] lg:text-[20px] md:text-[18px] sm:text-[16px] text-center uppercase whitespace-nowrap">
          <p className="leading-[28px] lg:leading-[28px] md:leading-[24px] sm:leading-[20px]">{t('home.whyChooseUs.nonCarbonated.title')}</p>
        </div>
      </div>

      {/* Card 3: No Artificial Ingredients */}
      <div className="absolute h-[278px] lg:h-[278px] md:h-[240px] sm:h-[220px] left-1/2 translate-x-[-50%] lg:translate-x-[362.5px] md:translate-x-[-50%] sm:translate-x-[-50%] top-[4932px] lg:top-[4932px] md:top-[4300px] sm:top-[3560px] w-[375px] lg:w-[375px] md:w-[45%] sm:w-[90%]">
        <div className="absolute bg-white inset-[15.83%_0_0_0] rounded-[37px]" />
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
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[60.07%_10.4%_22.66%_10.67%] lg:inset-[60.07%_10.4%_22.66%_10.67%] md:inset-[60.07%_10.4%_22.66%_10.67%] sm:inset-[60.07%_10.4%_22.66%_10.67%] justify-center leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px] not-italic text-[#64748b] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center">
          <p className="mb-0">{t('home.whyChooseUs.noArtificialIngredients.description')}</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[47.84%_11.2%_42.09%_10.93%] lg:inset-[47.84%_11.2%_42.09%_10.93%] md:inset-[47.84%_11.2%_42.09%_10.93%] sm:inset-[47.84%_11.2%_42.09%_10.93%] justify-center leading-[0] text-[#0f172a] text-[20px] lg:text-[20px] md:text-[18px] sm:text-[16px] text-center uppercase whitespace-nowrap">
          <p className="leading-[28px] lg:leading-[28px] md:leading-[24px] sm:leading-[20px]">{t('home.whyChooseUs.noArtificialIngredients.title')}</p>
        </div>
      </div>

      {/* Trusted By Section */}
      <div className="absolute content-stretch flex flex-col h-[461px] lg:h-[461px] md:h-[380px] sm:h-[320px] items-start left-1/2 px-[192px] lg:px-[192px] md:px-[48px] sm:px-[24px] py-[80px] lg:py-[80px] md:py-[60px] sm:py-[40px] top-[5651px] lg:top-[5651px] md:top-[4500px] sm:top-[3800px] translate-x-[-50%] w-full max-w-[1920px]">
        <div className="h-[277px] lg:h-[277px] md:h-[240px] sm:h-[200px] max-w-[1536px] relative shrink-0 w-full">
          <div className="absolute content-stretch flex flex-col items-center left-[calc(50%+0.5px)] top-[-34px] lg:top-[-34px] md:top-[-28px] sm:top-[-24px] translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%]">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[70px] lg:text-[70px] md:text-[48px] sm:text-[32px] text-center uppercase whitespace-nowrap">
              <p className="leading-[28px] lg:leading-[28px] md:leading-[24px] sm:leading-[22px]">{t('home.trustedBy.title')}</p>
            </div>
          </div>
          <div className="absolute content-stretch flex flex-col items-center left-[calc(50%+1px)] top-[37px] lg:top-[37px] md:top-[30px] sm:top-[24px] translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%]">
            <div className="flex flex-col font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center uppercase whitespace-nowrap">
              <p className="leading-[16px] lg:leading-[16px] md:leading-[14px] sm:leading-[12px]">{t('home.trustedBy.subtitle')}</p>
            </div>
          </div>
          {/* Partner Logos - Show all 3 at once, active one is larger */}
          <div className="absolute content-stretch flex items-center justify-center gap-[60px] lg:gap-[60px] md:gap-[40px] sm:gap-[30px] left-[calc(50%+0.5px)] top-[96px] translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%] h-[144px]">
            {/* Logo 0 - sas20 logo */}
            <div 
              className={`relative shrink-0 transition-all duration-300 cursor-pointer ${
                trustedByIndex === 0 
                  ? 'h-[144px] w-[178px] scale-110' 
                  : 'h-[100px] w-[124px] opacity-70 hover:opacity-90'
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
                  ? 'h-[144px] w-[221px] scale-110' 
                  : 'h-[100px] w-[154px] opacity-70 hover:opacity-90'
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
                  ? 'h-[144px] w-[246px] scale-110' 
                  : 'h-[100px] w-[171px] opacity-70 hover:opacity-90'
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
          <div className="absolute content-stretch flex h-[49px] items-center justify-center left-[24px] pt-[32px] right-[24px] top-[202px] z-[100]">
            <div className="flex items-center gap-[12px] relative shrink-0">
              <button
                type="button"
                onClick={() => setTrustedByIndex(0)}
                className={`rounded-[9999px] transition-all duration-300 ${
                  trustedByIndex === 0
                    ? 'bg-[#00d1ff] h-[10px] w-[24px]'
                    : 'bg-white size-[10px] hover:bg-[#00d1ff]/50 cursor-pointer'
                }`}
                aria-label="Show first partner"
              />
              <button
                type="button"
                onClick={() => setTrustedByIndex(1)}
                className={`rounded-[9999px] transition-all duration-300 ${
                  trustedByIndex === 1
                    ? 'bg-[#00d1ff] h-[10px] w-[24px]'
                    : 'bg-white size-[10px] hover:bg-[#00d1ff]/50 cursor-pointer'
                }`}
                aria-label="Show second partner"
              />
              <button
                type="button"
                onClick={() => setTrustedByIndex(2)}
                className={`rounded-[9999px] transition-all duration-300 ${
                  trustedByIndex === 2
                    ? 'bg-[#00d1ff] h-[10px] w-[24px]'
                    : 'bg-white size-[10px] hover:bg-[#00d1ff]/50 cursor-pointer'
                }`}
                aria-label="Show third partner"
              />
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="absolute content-stretch flex items-center justify-between left-[134px] right-[134px] top-[calc(50%+50.25px)] translate-y-[-50%] z-[100]">
            {/* Previous Button - Left side */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ [TRUSTED BY] Previous button clicked');
                handlePreviousTrustedBy(e);
              }}
              className="bg-gray-300 border-[#eee] border-[0.5px] border-solid flex items-center justify-center px-[8.5px] py-[6.5px] rounded-full size-[56px] cursor-pointer hover:bg-black/80 hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:bg-black/70 active:scale-95 transition-all duration-200 relative z-[101] group"
              aria-label="Previous partner"
            >
              <svg
                preserveAspectRatio="none"
                width="24.02"
                height="28"
                viewBox="0 0 24.02 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-[36px] w-[30px] transform rotate-180 group-hover:scale-110 transition-transform duration-200 pointer-events-none"
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
              className="bg-gray-300 border-[#eee] border-[0.5px] border-solid flex items-center justify-center px-[8.5px] py-[6.5px] rounded-full size-[56px] cursor-pointer hover:bg-black/80 hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:bg-black/70 active:scale-95 transition-all duration-200 relative z-[101] group"
              aria-label="Next partner"
            >
              <svg
                preserveAspectRatio="none"
                width="24.02"
                height="28"
                viewBox="0 0 24.02 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-[36px] w-[30px] transform group-hover:scale-110 transition-transform duration-200 pointer-events-none"
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

      {/* Footer */}
      <div className="absolute h-[700px] lg:h-[700px] md:h-[600px] sm:h-[500px] left-1/2 top-[6201px] lg:top-[6201px] md:top-[5000px] sm:top-[4200px] translate-x-[-50%] w-full max-w-[1920px] relative overflow-hidden">
        {/* Footer Background Image - daniel sinoca */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="Footer Background" className="absolute h-[144.5%] left-0 max-w-none top-[-44.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash1} />
        </div>
        {/* Dark overlay for better text readability */}
        <div className="absolute  inset-0" />
        <div className="absolute h-[449px] lg:h-[449px] md:h-[400px] sm:h-[350px] left-[calc(50%+0.5px)] top-[231px] lg:top-[231px] md:top-[180px] sm:top-[140px] translate-x-[-50%] w-[1200px] lg:w-[1200px] md:w-[90%] sm:w-[95%] relative z-10">
          <div className="absolute content-stretch flex gap-[258px] lg:gap-[258px] md:gap-[120px] sm:gap-[40px] items-start justify-start left-[calc(50%-16px)] top-0 translate-x-[-50%] flex-col md:flex-row sm:flex-col">
            {/* Column 1: Logo + Description */}
            <div className="flex flex-col h-[312px] lg:h-[312px] md:h-[280px] sm:h-auto relative shrink-0 w-[339px] lg:w-[339px] md:w-[45%] sm:w-full gap-[34px] lg:gap-[34px] md:gap-[24px] sm:gap-[20px]">
              <div className="content-stretch flex h-[14px] items-center left-0 top-0 w-[336px] lg:w-[336px] md:w-full sm:w-full">
                <div className="h-[34px] lg:h-[34px] md:h-[30px] sm:h-[26px] relative shrink-0 w-[112px] lg:w-[112px] md:w-[95px] sm:w-[80px]">
                  <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgBorborAguaLogoColorB2024Colored1} />
                </div>
              </div>
              <div className="content-stretch flex flex-row flex-wrap items-start left-0 w-[336px] lg:w-[336px] md:w-full sm:w-full">
                <div className="flex font-['Inter',sans-serif] font-bold justify-center leading-[26px] lg:leading-[26px] md:leading-[24px] sm:leading-[22px] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white w-full">
                  <p className="leading-[26px] lg:leading-[26px] md:leading-[24px] sm:leading-[22px]">
                    {t('home.footer.description')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-[10px] lg:gap-[10px] md:gap-[8px] sm:gap-[6px] left-0 relative">
                <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] whitespace-nowrap">
                  <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">{t('home.footer.more')}</p>
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

            {/* Column 2-4: Contact, Policies, Site Map */}
            <div className="content-stretch flex gap-[208px] lg:gap-[208px] md:gap-[80px] sm:gap-[40px] items-start relative shrink-0 flex-col md:flex-row sm:flex-col">
              {/* Column 2: Contact */}
              <div className="content-stretch flex flex-col gap-[24px] lg:gap-[24px] md:gap-[20px] sm:gap-[16px] items-start relative shrink-0 w-[241px] lg:w-[241px] md:w-[45%] sm:w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[24px] lg:text-[24px] md:text-[20px] sm:text-[18px] text-white tracking-[1.8px] lg:tracking-[1.8px] md:tracking-[1.5px] sm:tracking-[1.2px] uppercase w-full">
                    <p className="leading-[20px] lg:leading-[20px] md:leading-[18px] sm:leading-[16px] whitespace-pre-wrap">{t('home.footer.contact.title')}</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-row flex-wrap gap-[16px] lg:gap-[16px] md:gap-[12px] sm:gap-[10px] items-start relative shrink-0 w-[249px] lg:w-[249px] md:w-full sm:w-full">
                  <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap">
                    <p className="font-['Inter',sans-serif] font-bold mb-0">
                      <span className="leading-[24px]">{t('home.footer.contact.office')} </span>
                      <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[24px] underline" href="tel:0037433000401">
                        <span className="[text-decoration-skip-ink:none] decoration-solid leading-[24px]">+374 33 000401</span>
                      </a>
                    </p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">
                    <p className="font-['Inter',sans-serif] font-bold">
                      <span className="leading-[24px]">{t('home.footer.contact.delivery')} </span>
                      <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[24px] underline" href="tel:0037441012004">
                        <span className="[text-decoration-skip-ink:none] decoration-solid leading-[24px]">+374 41 012004</span>
                      </a>
                    </p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">
                    <p className="font-['Inter',sans-serif] font-bold">
                      <span className="leading-[24px]">{t('home.footer.contact.email')} </span>
                      <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[24px] underline" href="mailto:borboraqua.am@gmail.com">
                        <span className="[text-decoration-skip-ink:none] decoration-solid leading-[24px]">info@borboraqua.am</span>
                      </a>
                    </p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-bold justify-center leading-[24px] lg:leading-[24px] md:leading-[22px] sm:leading-[20px] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap">
                    <p className="mb-0">{t('home.footer.contact.location')} {t('home.footer.contact.locationLine1')}</p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-bold justify-center leading-[24px] lg:leading-[24px] md:leading-[22px] sm:leading-[20px] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap">
                    <p className="mb-0">{t('home.footer.contact.locationLine2')}</p>
                  </div>
                </div>
              </div>

              {/* Column 3: Policies */}
              <div className="content-stretch flex flex-col gap-[24px] lg:gap-[24px] md:gap-[20px] sm:gap-[16px] items-start relative shrink-0 w-[154px] lg:w-[154px] md:w-[45%] sm:w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white tracking-[1.6px] lg:tracking-[1.6px] md:tracking-[1.4px] sm:tracking-[1.2px] uppercase w-full">
                    <p className="leading-[20px] lg:leading-[20px] md:leading-[18px] sm:leading-[16px] whitespace-pre-wrap">{t('home.footer.policies.title')}</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-row flex-wrap gap-[18px] lg:gap-[18px] md:gap-[14px] sm:gap-[12px] items-start relative shrink-0 w-full">
                  <div
                    onClick={() => router.push('/privacy')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px] lg:leading-[24px] md:leading-[22px] sm:leading-[20px]">{t('home.footer.policies.privacyPolicy')}</p>
                  </div>
                  <div
                    onClick={() => router.push('/terms')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px]">{t('home.footer.policies.termsConditions')}</p>
                  </div>
                  <div
                    onClick={() => router.push('/delivery-terms')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px]">{t('home.footer.policies.deliveryTerms')}</p>
                  </div>
                  <div
                    onClick={() => router.push('/refund-policy')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px]">{t('home.footer.policies.refundPolicy')}</p>
                  </div>
                </div>
              </div>

              {/* Column 4: Site Map */}
              <div className="content-stretch flex flex-col gap-[24px] lg:gap-[24px] md:gap-[20px] sm:gap-[16px] items-start relative shrink-0 w-[94px] lg:w-[94px] md:w-[45%] sm:w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[16.5px] lg:text-[16.5px] md:text-[15px] sm:text-[13px] text-white tracking-[1.4px] lg:tracking-[1.4px] md:tracking-[1.2px] sm:tracking-[1px] uppercase w-full">
                    <p className="leading-[20px] lg:leading-[20px] md:leading-[18px] sm:leading-[16px] whitespace-pre-wrap">{t('home.footer.siteMap.title')}</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-row flex-wrap gap-[18px] lg:gap-[18px] md:gap-[14px] sm:gap-[12px] items-start relative shrink-0 w-full">
                  <div
                    onClick={() => router.push('/about')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px] lg:leading-[24px] md:leading-[22px] sm:leading-[20px]">{t('home.footer.siteMap.aboutUs')}</p>
                  </div>
                  <div
                    onClick={() => router.push('/contact')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px]">{t('home.footer.siteMap.contact')}</p>
                  </div>
                  <div
                    onClick={() => router.push('/products')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px]">{t('home.footer.siteMap.shop')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Icons */}
          <div className="absolute content-stretch flex gap-[16px] h-[48px] items-center left-[19px] pt-[8px] top-[312px] w-[336px]">
            <div className="border border-solid border-white content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[40px]">
              <div className="relative shrink-0 size-[20px]">
                <img alt="Social" className="block max-w-none size-full" src={imgSvg} />
              </div>
            </div>
            <div className="border border-solid border-white content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[40px]">
              <div className="relative shrink-0 size-[20px]">
                <img alt="Social" className="block max-w-none size-full" src={imgSvg1} />
              </div>
            </div>
            <div className="border border-solid border-white content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[40px]">
              <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
                <div className="col-1 ml-0 mt-0 relative row-1 size-[18px] overflow-hidden">
                  <div className="absolute inset-0">
                    <img alt="Social" className="block max-w-none size-full" src={imgGroup} />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative shrink-0 size-[40px]">
              <img alt="Social" className="block max-w-none size-full" src={imgLink} />
            </div>
          </div>

          {/* Copyright & Payment Icons */}
          <div className="absolute border-[#e2e8f0] border-solid border-t content-stretch flex items-center justify-between left-[24px] lg:left-[24px] md:left-[16px] sm:left-[12px] pt-[41px] lg:pt-[41px] md:pt-[32px] sm:pt-[24px] top-[392px] lg:top-[392px] md:top-[320px] sm:top-[280px] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%] flex-col sm:flex-col md:flex-row">
            <div className="relative shrink-0">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center relative">
                <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] lg:text-[12px] md:text-[11px] sm:text-[10px] text-black whitespace-nowrap">
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

      {/* Additional Decorative Elements - Hero Section Bubbles */}
      {/* Background ellipse at original left position */}
      <div className="absolute top-[38.44%] right-[66.93%] bottom-[43.57%] left-[-35] overflow-hidden pointer-events-none">
        <img alt="Background Ellipse" className="block max-w-none size-full" src={imgEllipse41} />
      </div>

      {/* Main large bubble */}
      <div className="absolute flex top-[44.44%] right-[56%] bottom-[43.57%] left-0 items-center justify-center overflow-hidden">
        <div className="relative rounded-[320px] size-[564.622px]">
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

      {/* Image 5 - Decorative Element */}
      <div className="absolute flex items-center justify-center left-[534px] top-[1574px] size-[110px]">
        <div className="relative rounded-[320px] size-full">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Image 5" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={imgImage5} />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
        </div>
      </div>

      {/* Image 11 - Decorative Element */}
      <div className="absolute flex items-center justify-center left-[1603px] top-[1233px] size-[210px]">
        <div className="relative rounded-[320px] size-full">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Image 11" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={imgImage11} />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
        </div>
      </div>

      <div className="absolute flex inset-[20.54%_16.59%_77.5%_76.61%] items-center justify-center">
        <div className="relative rounded-[320px] size-[92.381px]">
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

      {/* Upper bubble - move to the right side a bit higher */}
      <div className="absolute flex top-[38%] right-[1%] bottom-[50.88%] left-auto items-center justify-center overflow-hidden">
        <div className="relative rounded-[320px] size-[459px]">
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
                  console.log('✅ [IMAGE] Decorative image loaded:', );
                }}
              />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[900px]" />
        </div>
      </div>

      <div className="absolute flex top-[43.7%] right-[84.95%] bottom-[49.82%] left-0 items-center justify-center overflow-hidden">
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
      </div>

      {/* Lower bubble 2 - move a bit further down */}
      <div className="absolute flex top-[52%] right-[-10%] bottom-[39.8%] left-auto items-center justify-center overflow-hidden">
        <div className="relative rounded-[320px] size-[459px]">
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
      <div className="absolute flex top-[52%] right-[1%] bottom-[38.23%] left-auto items-center justify-center overflow-hidden">
        <div className="relative rounded-[320px] size-[297.625px]">
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

      {/* Featured Products Section Decorative Elements */}

      <div className="absolute flex top-0 right-[75.18%] bottom-[55.65%] left-0 items-center justify-center overflow-hidden">
        <div className="relative rounded-[320px] size-[456.082px]">
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
      <div className="absolute h-[678.858px] left-[calc(50%+31px)] top-[2777px] translate-x-[-50%] w-[914px]">
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
                <div className="flex-none h-[676.803px] rotate-[-0.5deg] w-[238.454px]">
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
            <p className="leading-[50px] mb-0 text-[66px]">{t('home.waterEnergySection.pure')}</p>
            <p className="leading-[50px] mb-0 text-[66px]">{t('home.waterEnergySection.energy')}</p>
            <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] text-[16px]">{t('home.waterEnergySection.subtitle')}</p>
          </div>
          <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[29.76%_62.8%_62.88%_0] justify-center leading-[0] text-[#09c1ff] text-[66px] tracking-[-0.9px] uppercase whitespace-nowrap">
            <p className="leading-[50px]">{t('home.waterEnergySection.balance')}</p>
          </div>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-normal inset-[22.39%_62.8%_72.01%_7.99%] justify-center leading-[19px] text-[#0f172a] text-[16px] text-right tracking-[-0.9px] uppercase whitespace-nowrap">
          <p className="mb-0">{t('home.waterEnergySection.descriptionLine1')}</p>
          <p className="mb-0">{t('home.waterEnergySection.descriptionLine2')}</p>
        </div>
      </div>

      {/* Vector Graphics for Why Choose Us */}
      <div className="absolute contents left-[441px] top-[4748px]">
        <div className="absolute flex h-[325px] items-center justify-center left-[844px] mix-blend-lighten top-[4846px] w-[521.999px]">
          <div className="flex-none rotate-[180deg]">
            <div className="h-[325px] relative w-[521.999px]">
              <img alt="Vector" className="block max-w-none size-full" src={imgVector4} />
            </div>
          </div>
        </div>
        <div className="absolute flex h-[521.999px] items-center justify-center left-[440px] top-[4748px] w-[325px]">
          <div className="flex-none rotate-[-90deg]">
            <div className="h-[325px] relative w-[521.999px]">
              <img alt="Vector" className="block max-w-none size-full" src={imgVector5} />
            </div>
          </div>
        </div>
        <div className="absolute flex h-[325px] items-center justify-center left-[954px] mix-blend-lighten top-[5127px] w-[461px]">
          <div className="flex-none scale-y-[-100%]">
            <div className="h-[325px] relative w-[461px]">
              <img alt="Vector" className="block max-w-none size-full" src={imgVector6} />
            </div>
          </div>
        </div>
        <div className="absolute flex h-[325px] items-center justify-center left-[441px] mix-blend-lighten top-[5127px] w-[526px]">
          <div className="flex-none rotate-[180deg]">
            <div className="h-[325px] relative w-[526px]">
              <img alt="Vector" className="block max-w-none size-full" src={imgVector7} />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-[5352px] translate-x-[-50%] w-[78px]">
        <img alt="Vector" className="block max-w-none size-full" src={imgVector} />
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 px-4">
          <div
            ref={searchModalRef}
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200/80 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              {/* Search Input */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('home.search.placeholder')}
                className="flex-1 h-11 px-4 border-2 border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm placeholder:text-gray-400"
              />

              {/* Search Button */}
              <button
                type="submit"
                className="h-11 px-6 bg-gray-900 text-white rounded-r-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      </div>
    </>
  );
}
