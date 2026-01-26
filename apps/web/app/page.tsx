'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { figmaImages } from '../config/figma-images';
import { getImageOverlayStyles, getOverlayDivStyles } from '../config/figma-image-overlays';
import { apiClient } from '../lib/api-client';
import { formatPrice, getStoredCurrency } from '../lib/currency';
import { getStoredLanguage, setStoredLanguage, LANGUAGES, type LanguageCode } from '../lib/language';
import { useAuth } from '../lib/auth/AuthContext';
import { CartIcon } from '../components/icons/CartIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { HeaderCartIcon } from '../components/icons/HeaderCartIcon';
import { LanguageIcon } from '../components/icons/LanguageIcon';
import { ExitIcon } from '../components/icons/ExitIcon';

// Local image paths - Images stored in public/assets/home/
const imgBorborAguaLogoColorB2024Colored1 = "/assets/home/imgBorborAguaLogoColorB2024Colored1.png";
const imgDanielSinocaAancLsb0SU0Unsplash1 = "/assets/home/imgDanielSinocaAancLsb0SU0Unsplash1.jpg";
const imgDanielSinocaAancLsb0SU0Unsplash2 = "/assets/home/imgDanielSinocaAancLsb0SU0Unsplash2.jpg";
const img = "/assets/home/img.png";
const img1 = "/assets/home/img1.png";
const img2 = "/assets/home/img2.png";
const img3 = "/assets/home/img3.png";
const img6Eb12990A37F43358E368Af827A9C8A5Png1 = "/assets/home/img6Eb12990A37F43358E368Af827A9C8A5Png1.png";
const imgLogo1 = "/assets/home/imgLogo1.png";
const imgSas20Logo1 = "/assets/home/imgSas20Logo1.png";
const img5 = "/assets/home/img5.png";
const img6 = "/assets/home/img6.png";
const img17 = "/assets/home/img17.png";
const imgFrame3292 = "/assets/home/imgFrame3292.svg";
const imgEllipse41 = "/assets/home/imgEllipse41.svg";
const imgShape = "/assets/home/imgShape.svg";
const imgEllipse44 = "/assets/home/imgEllipse44.svg";
const imgShape1 = "/assets/home/imgShape1.svg";
const imgShape2 = "/assets/home/imgShape2.svg";
const imgEllipse42 = "/assets/home/imgEllipse42.svg";
const imgShape3 = "/assets/home/imgShape3.svg";
const imgEllipse43 = "/assets/home/imgEllipse43.svg";
const imgGroup2105 = "/assets/home/imgGroup2105.svg";
const imgIcon = "/assets/home/imgIcon.svg";
const img4 = "/assets/home/img4.svg";
const imgIcon1 = "/assets/home/imgIcon1.svg";
const imgVector4 = "/assets/home/imgVector4.svg";
const imgVector5 = "/assets/home/imgVector5.svg";
const imgVector6 = "/assets/home/imgVector6.svg";
const imgVector7 = "/assets/home/imgVector7.svg";
const imgVector = "/assets/home/imgVector.svg";
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
  const { isLoggedIn, logout } = useAuth();
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
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

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
        alert('No variants available');
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
        alert('Product not found');
        return;
      }

      // Check if error is about insufficient stock
      if (error.response?.data?.detail?.includes('No more stock available') ||
        error.response?.data?.detail?.includes('exceeds available stock') ||
        error.response?.data?.title === 'Insufficient stock') {
        alert('No more stock available');
        return;
      }

      // If error is about authorization, redirect to login
      if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error?.status === 401) {
        router.push(`/login?redirect=/`);
      } else {
        alert('Failed to add product to cart. Please try again.');
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
    <div
      ref={containerRef}
      className="bg-white relative w-full max-w-[1440px] mx-auto h-[6901px] lg:h-[6901px] md:h-[5600px] sm:h-[4700px] home-page-container"
    >
      {/* Header Section - Navigation Bar */}
      <div className="fixed bg-[rgba(255,255,255,0.04)] backdrop-blur-[10px] content-stretch flex flex-col h-[73px] md:h-[60px] sm:h-[50px] items-center justify-center left-1/2 px-[38px] md:px-[24px] sm:px-[16px] py-[16px] md:py-[12px] sm:py-[8px] rounded-[70px] md:rounded-[50px] sm:rounded-[40px] top-[64px] md:top-[32px] sm:top-[16px] translate-x-[-50%] w-[1200px] lg:w-[1200px] md:w-[90%] sm:w-[95%] z-50">
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
              <p className="leading-[20px]">HOME</p>
            </div>
            <div
              onClick={() => router.push('/products')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">SHOP</p>
            </div>
            <div
              onClick={() => router.push('/about')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">ABOUT US</p>
            </div>
            <div
              onClick={() => router.push('/contact')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">CONTACT US</p>
            </div>
            <div
              onClick={() => router.push('/blog')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">BLOG</p>
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

            {/* Exit/Logout Icon */}
            {isLoggedIn ? (
              <div
                onClick={handleLogout}
                className="h-[20px] md:h-[18px] sm:h-[16px] w-[20px] md:w-[18px] sm:w-[16px] relative shrink-0 cursor-pointer flex items-center justify-center"
              >
                <ExitIcon size={20} />
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
      <div className="absolute flex items-center justify-center left-[600px] top-[300px] size-[806px]">
        <div className="relative rounded-[320px] size-full">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Image 13" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img13Decorative} />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
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
                <p className="leading-[20px] lg:leading-[20px] md:leading-[18px] sm:leading-[16px]">Experience Purity</p>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[96px] lg:text-[96px] md:text-[64px] sm:text-[36px] text-center text-white w-full">
              <p className="whitespace-pre-wrap">
                <span className="leading-[96px] lg:leading-[96px] md:leading-[64px] sm:leading-[40px] text-white font-black">YOUR </span>
                <span className="font-['Montserrat',sans-serif] font-light leading-[96px] lg:leading-[96px] md:leading-[64px] sm:leading-[40px] text-white">DAILY DOSE OF</span>
                <span className="leading-[96px] lg:leading-[96px] md:leading-[64px] sm:leading-[40px]"> </span>
                <span className="leading-[96px] lg:leading-[96px] md:leading-[64px] sm:leading-[40px] text-white font-black">FRESHNESS</span>
              </p>
            </div>
          </div>

          {/* Subtitle */}
          <div className="content-stretch flex flex-col items-center justify-center max-w-[512px] lg:max-w-[512px] md:max-w-[400px] sm:max-w-[280px] relative shrink-0 w-[512px] lg:w-[512px] md:w-full sm:w-full">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[20px] lg:text-[20px] md:text-[18px] sm:text-[14px] text-white whitespace-nowrap">
              <p className="leading-[32.5px] lg:leading-[32.5px] md:leading-[28px] sm:leading-[22px]">Natural spring water</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="content-center flex flex-wrap gap-[0px_16px] lg:gap-[0px_16px] md:gap-[0px_12px] sm:gap-[0px_8px] h-[76px] lg:h-[76px] md:h-[64px] sm:h-[56px] items-center justify-center pt-[16px] lg:pt-[16px] md:pt-[12px] sm:pt-[8px] relative shrink-0 w-full">
            <div
              onClick={() => router.push('/products')}
              className="bg-[#1ac0fd] content-stretch flex flex-col h-[60px] lg:h-[60px] md:h-[52px] sm:h-[44px] items-center justify-center pl-[63px] pr-[61px] lg:pl-[63px] lg:pr-[61px] md:pl-[48px] md:pr-[46px] sm:pl-[32px] sm:pr-[30px] py-[16px] lg:py-[16px] md:py-[12px] sm:py-[10px] relative rounded-[9999px] shrink-0 w-[185px] lg:w-[185px] md:w-[160px] sm:w-[140px] cursor-pointer hover:bg-[#00b8e6] transition-colors"
            >
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-white whitespace-nowrap">
                <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">Shop Now</p>
              </div>
            </div>
            <div
              onClick={() => router.push('/about')}
              className="bg-[rgba(0,0,0,0)] content-stretch flex flex-col h-[60px] lg:h-[60px] md:h-[52px] sm:h-[44px] items-center justify-center px-[40px] lg:px-[40px] md:px-[32px] sm:px-[24px] py-[16px] lg:py-[16px] md:py-[12px] sm:py-[10px] relative rounded-[9999px] shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[19px] lg:h-[19px] md:h-[17px] sm:h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-white w-[89px] lg:w-[89px] md:w-[75px] sm:w-[65px]">
                <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px] whitespace-pre-wrap">Learn More</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Water Wave Graphic */}
      <div className="absolute h-[807px] left-0 top-[1158px] w-full max-w-[1920px]">
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

      <div className="absolute h-[1031px] left-1/2 top-[4834px] translate-x-[-50%] w-[1008px] overflow-hidden">
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
      <div className="absolute flex items-center justify-center left-[calc(50%+846.59px)] mix-blend-luminosity size-[1045.176px] top-[2628px] translate-x-[-50%]">
        <div className="flex-none rotate-[-56.31deg] figma-rotate-slow">
          <div className="relative size-[753.698px]">
            <img alt="Shape" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
      </div>

      <div className="absolute flex items-center justify-center left-[calc(50%+119.2px)] mix-blend-luminosity size-[956.401px] top-[5477px] translate-x-[-50%]">
        <div className="flex-none rotate-[-16.26deg] scale-y-[-100%] figma-rotate-slow">
          <div className="relative size-[771.293px]">
            <img alt="Shape" className="block max-w-none size-full" src={imgShape1} />
          </div>
        </div>
      </div>

      <div className="absolute flex items-center justify-center left-[calc(50%-587.04px)] mix-blend-luminosity size-[641.928px] top-[3208px] translate-x-[-50%]">
        <div className="flex-none rotate-[-165deg] figma-rotate-slow">
          <div className="relative size-[524.132px]">
            <img alt="Shape" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
      </div>

      <div className="absolute flex items-center justify-center left-[calc(50%-1082.68px)] mix-blend-luminosity size-[944.637px] top-[3493px] translate-x-[-50%]">
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
        <div className="absolute h-[976px] lg:h-[976px] md:h-[750px] sm:h-[600px] left-1/2 translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%] top-[139px] lg:top-[139px] md:top-[100px] sm:top-[80px] relative z-10">
          {/* Section Header */}
          <div className="absolute content-stretch flex flex-col gap-[16px] lg:gap-[16px] md:gap-[12px] sm:gap-[10px] items-start left-0 lg:left-0 md:left-[16px] sm:left-[12px] right-0 lg:right-0 md:right-[16px] sm:right-[12px] top-[-37px] lg:top-[-37px] md:top-[-30px] sm:top-[-24px]">
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[70px] lg:text-[70px] md:text-[48px] sm:text-[32px] text-center text-white tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
                <p className="leading-[40px] lg:leading-[40px] md:leading-[32px] sm:leading-[28px]">FEATURED PRODUCTS</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center text-white whitespace-nowrap">
                <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">Premium water designed for modern living</p>
              </div>
            </div>
          </div>


          

          {/* Products Grid - Uniform Layout */}
          <div className="absolute h-[442px] lg:h-[442px] md:h-[330px] sm:h-[270px] left-0 lg:left-0 md:left-[16px] sm:left-[12px] right-0 lg:right-0 md:right-[16px] sm:right-[12px] top-[166px] lg:top-[166px] md:top-[120px] sm:top-[100px] z-[10]">
            {productsLoading ? (
              // Loading state - show placeholder with uniform grid
              <div className="flex gap-[40px] lg:gap-[40px] md:gap-[30px] sm:gap-[20px] justify-center items-start h-full">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-[24px] w-[320px] lg:w-[320px] md:w-[280px] sm:w-[240px]">
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
                        className="flex flex-col items-center gap-[24px] w-[320px] lg:w-[320px] md:w-[280px] sm:w-[240px] cursor-pointer product-card-hover z-[11] isolate"
                      >
                        {/* Image Container - Uniform size with overflow hidden */}
                        <div className="h-[320px] lg:h-[320px] md:h-[280px] sm:h-[240px] w-full relative overflow-hidden flex items-center justify-center bg-transparent">
                          {product.image ? (
                            <img
                              alt={product.title}
                              className="h-full w-full object-contain product-image-hover"
                              src={product.image}
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
                                {addingToCart.has(product.id) ? 'Adding...' : 'Add to Cart'}
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              // Fallback to original hardcoded products if no products loaded - uniform layout
              <div className="flex gap-[40px] lg:gap-[40px] md:gap-[30px] sm:gap-[20px] justify-center items-start h-full">
                <div className="flex flex-col items-center gap-[24px] w-[320px] lg:w-[320px] md:w-[280px] sm:w-[240px]">
                  <div className="h-[320px] lg:h-[320px] md:h-[280px] sm:h-[240px] w-full relative overflow-hidden flex items-center justify-center bg-transparent">
                    <img alt="Product 19L" className="h-full w-full object-contain" src={img1} />
                  </div>
                  <div className="w-full flex flex-col gap-[16px] px-[16px] pb-[16px]">
                    <div className="flex items-end justify-between w-full">
                      <div className="flex flex-col items-start">
                        <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] text-white whitespace-nowrap">
                          <p className="leading-[28px]">Natural spring water</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start">
                        <div className="flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[20px] whitespace-nowrap">
                          <p className="leading-[28px]">1800 AMD</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#00d1ff] content-stretch flex items-center justify-center py-[12px] relative rounded-[34px] shrink-0 w-full">
                      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
                        <p className="leading-[24px]">Add to Cart</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Arrows - Only show if we have more than 3 products */}
            {featuredProducts.length > 3 && (
              <>
                {/* Next Button - Left side, outside container */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ [CAROUSEL] Next button clicked');
                    handleNextProducts(e);
                  }}
                  className="absolute bg-transparent border-[0.5px] border-white/49 border-solid flex items-center justify-center px-[8.5px] py-[6.5px] rounded-full size-[56px] lg:size-[56px] md:size-[48px] sm:size-[40px] cursor-pointer hover:bg-white/20 hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:bg-white/30 active:scale-95 transition-all duration-200 z-[10001] group left-[calc(50%-650px)] lg:left-[calc(50%-650px)] md:left-[calc(50%-500px)] sm:left-[calc(50%-400px)] top-[295px] lg:top-[295px] md:top-[220px] sm:top-[180px]"
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

                {/* Previous Button - Right side, outside container */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ [CAROUSEL] Previous button clicked');
                    handlePreviousProducts(e);
                  }}
                  className="absolute bg-transparent border-[0.5px] border-white/49 border-solid flex items-center justify-center px-[8.5px] py-[6.5px] rounded-full size-[56px] lg:size-[56px] md:size-[48px] sm:size-[40px] cursor-pointer hover:bg-white/20 hover:border-white/80 hover:shadow-lg hover:shadow-[#00d1ff]/50 active:bg-white/30 active:scale-95 transition-all duration-200 z-[10001] group right-[calc(50%-650px)] lg:right-[calc(50%-650px)] md:right-[calc(50%-500px)] sm:right-[calc(50%-400px)] top-[295px] lg:top-[295px] md:top-[220px] sm:top-[180px]"
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
          </div>

          {/* Pagination Dots - Show 3 dots for 3 carousel modes */}
          {featuredProducts.length > 3 && (
            <div className="absolute contents left-1/2 top-[920px] translate-x-[-50%]">
              {/* Dot 1 - First mode (products 0-2) */}
              <button
                type="button"
                onClick={() => setCarouselIndex(0)}
                className={`absolute rounded-full top-[920px] translate-x-[-50%] transition-all duration-300 ${
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
                className={`absolute rounded-full top-[920px] translate-x-[-50%] transition-all duration-300 ${
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
                className={`absolute rounded-full top-[920px] translate-x-[-50%] transition-all duration-300 ${
                  carouselIndex === 6
                    ? 'bg-[#00d1ff] h-[6px] w-[16px] left-[calc(50%+17px)]'
                    : 'bg-[#e2e8f0] size-[6px] left-[calc(50%+17px)] hover:bg-[#00d1ff]/50'
                }`}
                aria-label="Show third 3 products"
              />
            </div>
          )}

          {/* View All Products Button */}
          <div className="absolute content-stretch flex flex-col items-center left-[24px] lg:left-[24px] md:left-[16px] sm:left-[12px] right-[24px] lg:right-[24px] md:right-[16px] sm:right-[12px] top-[976px] lg:top-[976px] md:top-[750px] sm:top-[600px]">
            <div
              onClick={() => router.push('/products')}
              className="border-2 border-[#e2e8f0] border-solid content-stretch flex gap-[8px] lg:gap-[8px] md:gap-[6px] sm:gap-[4px] items-center px-[34px] lg:px-[34px] md:px-[28px] sm:px-[20px] py-[12px] lg:py-[12px] md:py-[10px] sm:py-[8px] relative rounded-[9999px] shrink-0 cursor-pointer hover:border-[#00d1ff] hover:bg-[#00d1ff]/5 transition-all"
            >
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center whitespace-nowrap">
                <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">View All Products</p>
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
          <div className="absolute content-stretch flex items-start justify-center left-1/2 top-[59px] translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%]">
            <div className="bg-[#00d1ff] h-[5px] rounded-[30px] shrink-0 w-[90px]" />
          </div>
        </div>
      </div>



      {/* Water Energy Section */}
      <div className="absolute content-stretch flex flex-col gap-[35px] lg:gap-[35px] md:gap-[28px] sm:gap-[20px] items-start left-1/2 top-[2606px] lg:top-[2606px] md:top-[2000px] sm:top-[1600px] translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%]">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[70px] lg:text-[70px] md:text-[48px] sm:text-[32px] text-center tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase w-[641px] lg:w-[641px] md:w-[500px] sm:w-full">
              <p className="leading-[40px] lg:leading-[40px] md:leading-[32px] sm:leading-[28px] whitespace-pre-wrap">WATER ENERGY</p>
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
          <p className="leading-[40px] lg:leading-[40px] md:leading-[32px] sm:leading-[28px]">98%</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[12.83%_29.35%_58.02%_5.29%] lg:inset-[12.83%_29.35%_58.02%_5.29%] md:inset-[12.83%_29.35%_58.02%_5.29%] sm:inset-[12.83%_29.35%_58.02%_5.29%] justify-center leading-[50px] lg:leading-[50px] md:leading-[40px] sm:leading-[32px] text-[46px] lg:text-[46px] md:text-[36px] sm:text-[28px] text-white tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
          <p className="mb-0">Pure spring water</p>
          <p className="font-['Montserrat',sans-serif] font-light">from Armenia</p>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-medium inset-[83.67%_3.9%_9.33%_82.24%] lg:inset-[83.67%_3.9%_9.33%_82.24%] md:inset-[83.67%_3.9%_9.33%_82.24%] sm:inset-[83.67%_3.9%_9.33%_82.24%] italic justify-center leading-[0] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center text-white whitespace-nowrap">
          <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">Natura Source</p>
        </div>
      </div>

      {/* White Card (100%) */}
      <div className="absolute h-[343px] lg:h-[343px] md:h-[280px] sm:h-[240px] left-[393px] lg:left-[393px] md:left-[20.5%] sm:left-[5%] top-[3931px] lg:top-[3931px] md:top-[3100px] sm:top-[2500px] w-[795px] lg:w-[795px] md:w-[60%] sm:w-[90%]">
        <div className="absolute bg-white inset-0 rounded-[37px] lg:rounded-[37px] md:rounded-[30px] sm:rounded-[24px]" />
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[69.68%_60%_18.66%_7.42%] lg:inset-[69.68%_60%_18.66%_7.42%] md:inset-[69.68%_60%_18.66%_7.42%] sm:inset-[69.68%_60%_18.66%_7.42%] justify-center leading-[0] text-[#0f172a] text-[96px] lg:text-[96px] md:text-[72px] sm:text-[56px] text-center tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
          <p className="leading-[40px] lg:leading-[40px] md:leading-[32px] sm:leading-[28px]">100%</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[12.83%_5.28%_58.02%_22.26%] lg:inset-[12.83%_5.28%_58.02%_22.26%] md:inset-[12.83%_5.28%_58.02%_22.26%] sm:inset-[12.83%_5.28%_58.02%_22.26%] justify-center leading-[50px] lg:leading-[50px] md:leading-[40px] sm:leading-[32px] text-[#00d1ff] text-[46px] lg:text-[46px] md:text-[36px] sm:text-[28px] text-right tracking-[-0.9px] lg:tracking-[-0.9px] md:tracking-[-0.7px] sm:tracking-[-0.5px] uppercase whitespace-nowrap">
          <p className="mb-0">Balanced hydration</p>
          <p className="font-['Montserrat',sans-serif] font-light">every day</p>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-medium inset-[53.94%_78.24%_39.07%_7.42%] lg:inset-[53.94%_78.24%_39.07%_7.42%] md:inset-[53.94%_78.24%_39.07%_7.42%] sm:inset-[53.94%_78.24%_39.07%_7.42%] italic justify-center leading-[0] text-[#00d1ff] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center whitespace-nowrap">
          <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">Clean Minerals</p>
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
              <p className="leading-[40px] lg:leading-[40px] md:leading-[32px] sm:leading-[28px]">Why Choose Us</p>
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
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[61.19%_13.33%_22.03%_13.6%] lg:inset-[61.19%_13.33%_22.03%_13.6%] md:inset-[61.19%_13.33%_22.03%_13.6%] sm:inset-[61.19%_13.33%_22.03%_13.6%] justify-center leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px] not-italic text-[#64748b] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center whitespace-nowrap">
          <p className="mb-0">Rich in Natural Minerals that provide</p>
          <p>valuable health benefits.</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[49.3%_24%_40.91%_23.73%] lg:inset-[49.3%_24%_40.91%_23.73%] md:inset-[49.3%_24%_40.91%_23.73%] sm:inset-[49.3%_24%_40.91%_23.73%] justify-center leading-[0] text-[#0f172a] text-[20px] lg:text-[20px] md:text-[18px] sm:text-[16px] text-center uppercase whitespace-nowrap">
          <p className="leading-[28px] lg:leading-[28px] md:leading-[24px] sm:leading-[20px]">RICH IN MINERALS</p>
        </div>
      </div>

      {/* Card 2: Non-Carbonated */}
      <div className="absolute h-[272px] lg:h-[272px] md:h-[240px] sm:h-[220px] left-1/2 translate-x-[-50%] lg:translate-x-[-362.5px] md:translate-x-[-50%] sm:translate-x-[-50%] top-[5086px] lg:top-[5086px] md:top-[4000px] sm:top-[3280px] w-[375px] lg:w-[375px] md:w-[45%] sm:w-[90%]">
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
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[60.66%_13.33%_24.63%_13.6%] lg:inset-[60.66%_13.33%_24.63%_13.6%] md:inset-[60.66%_13.33%_24.63%_13.6%] sm:inset-[60.66%_13.33%_24.63%_13.6%] justify-center leading-[20px] lg:leading-[20px] md:leading-[18px] sm:leading-[16px] not-italic text-[#64748b] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center whitespace-nowrap">
          <p className="mb-0">Borbor Aqua does not infuse carbon</p>
          <p>dioxide in any of its bottled water.</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[46.69%_22.4%_43.01%_22.4%] lg:inset-[46.69%_22.4%_43.01%_22.4%] md:inset-[46.69%_22.4%_43.01%_22.4%] sm:inset-[46.69%_22.4%_43.01%_22.4%] justify-center leading-[0] text-[#0f172a] text-[20px] lg:text-[20px] md:text-[18px] sm:text-[16px] text-center uppercase whitespace-nowrap">
          <p className="leading-[28px] lg:leading-[28px] md:leading-[24px] sm:leading-[20px]">NON-CARBONATED</p>
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
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[60.07%_10.4%_22.66%_10.67%] lg:inset-[60.07%_10.4%_22.66%_10.67%] md:inset-[60.07%_10.4%_22.66%_10.67%] sm:inset-[60.07%_10.4%_22.66%_10.67%] justify-center leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px] not-italic text-[#64748b] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center whitespace-nowrap">
          <p className="mb-0">Borbor Aqua does not include any</p>
          <p>artificial ingredients in its bottled water</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[47.84%_11.2%_42.09%_10.93%] lg:inset-[47.84%_11.2%_42.09%_10.93%] md:inset-[47.84%_11.2%_42.09%_10.93%] sm:inset-[47.84%_11.2%_42.09%_10.93%] justify-center leading-[0] text-[#0f172a] text-[20px] lg:text-[20px] md:text-[18px] sm:text-[16px] text-center uppercase whitespace-nowrap">
          <p className="leading-[28px] lg:leading-[28px] md:leading-[24px] sm:leading-[20px]">no artifical ingridients</p>
        </div>
      </div>

      {/* Trusted By Section */}
      <div className="absolute content-stretch flex flex-col h-[461px] lg:h-[461px] md:h-[380px] sm:h-[320px] items-start left-1/2 px-[192px] lg:px-[192px] md:px-[48px] sm:px-[24px] py-[80px] lg:py-[80px] md:py-[60px] sm:py-[40px] top-[5651px] lg:top-[5651px] md:top-[4500px] sm:top-[3800px] translate-x-[-50%] w-full max-w-[1920px]">
        <div className="h-[277px] lg:h-[277px] md:h-[240px] sm:h-[200px] max-w-[1536px] relative shrink-0 w-full">
          <div className="absolute content-stretch flex flex-col items-center left-[calc(50%+0.5px)] top-[-34px] lg:top-[-34px] md:top-[-28px] sm:top-[-24px] translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%]">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[70px] lg:text-[70px] md:text-[48px] sm:text-[32px] text-center uppercase whitespace-nowrap">
              <p className="leading-[28px] lg:leading-[28px] md:leading-[24px] sm:leading-[22px]">Trusted By</p>
            </div>
          </div>
          <div className="absolute content-stretch flex flex-col items-center left-[calc(50%+1px)] top-[37px] lg:top-[37px] md:top-[30px] sm:top-[24px] translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%]">
            <div className="flex flex-col font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] text-center uppercase whitespace-nowrap">
              <p className="leading-[16px] lg:leading-[16px] md:leading-[14px] sm:leading-[12px]">Industry leading partners</p>
            </div>
          </div>
          {/* Partner Logos - Show one at a time based on trustedByIndex */}
          <div className="absolute content-stretch flex items-center justify-center left-[calc(50%+0.5px)] top-[96px] translate-x-[-50%] w-[1100px] lg:w-[1100px] md:w-[90%] sm:w-[95%] h-[144px]">
            {/* Logo 0 */}
            {trustedByIndex === 0 && (
              <div className="h-[144px] relative shrink-0 w-[221px] transition-opacity duration-300">
                <img alt="Partner Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={img6Eb12990A37F43358E368Af827A9C8A5Png1} />
              </div>
            )}
            {/* Logo 1 */}
            {trustedByIndex === 1 && (
              <div className="h-[68.253px] relative shrink-0 w-[246px] transition-opacity duration-300">
                <img alt="Partner Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgLogo1} />
              </div>
            )}
            {/* Logo 2 */}
            {trustedByIndex === 2 && (
              <div className="h-[85px] relative shrink-0 w-[178px] transition-opacity duration-300">
                <img alt="Partner Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgSas20Logo1} />
              </div>
            )}
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
                    New Aqua LLC introduces its Natural Spring Bottled Water – Borbor Aqua. Our range of products consists of 0.25L, 0.33L, 0.5L, 1L, 5L & 19L water bottles. Our Natural spring bottled water is non-carbonated. It is rich in natural minerals that provide valuable health benefits to everyone.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-[10px] lg:gap-[10px] md:gap-[8px] sm:gap-[6px] left-0 relative">
                <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[16px] lg:text-[16px] md:text-[14px] sm:text-[12px] whitespace-nowrap">
                  <p className="leading-[24px] lg:leading-[24px] md:leading-[20px] sm:leading-[18px]">More</p>
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
                    <p className="leading-[20px] lg:leading-[20px] md:leading-[18px] sm:leading-[16px] whitespace-pre-wrap">CONTACT</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-row flex-wrap gap-[16px] lg:gap-[16px] md:gap-[12px] sm:gap-[10px] items-start relative shrink-0 w-[249px] lg:w-[249px] md:w-full sm:w-full">
                  <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap">
                    <p className="font-['Inter',sans-serif] font-bold mb-0">
                      <span className="leading-[24px]">{`Office: `}</span>
                      <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[24px] underline" href="tel:0037433000401">
                        <span className="[text-decoration-skip-ink:none] decoration-solid leading-[24px]">+374 33 000401</span>
                      </a>
                    </p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">
                    <p className="font-['Inter',sans-serif] font-bold">
                      <span className="leading-[24px]">{`Delivery: `}</span>
                      <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[24px] underline" href="tel:0037441012004">
                        <span className="[text-decoration-skip-ink:none] decoration-solid leading-[24px]">+374 41 012004</span>
                      </a>
                    </p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">
                    <p className="font-['Inter',sans-serif] font-bold">
                      <span className="leading-[24px]">{`Email: `}</span>
                      <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[24px] underline" href="mailto:borboraqua.am@gmail.com">
                        <span className="[text-decoration-skip-ink:none] decoration-solid leading-[24px]">info@borboraqua.am</span>
                      </a>
                    </p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-bold justify-center leading-[24px] lg:leading-[24px] md:leading-[22px] sm:leading-[20px] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap">
                    <p className="mb-0">Location: 1412, Gegharkunik,</p>
                  </div>
                  <div className="flex font-['Inter',sans-serif] font-bold justify-center leading-[24px] lg:leading-[24px] md:leading-[22px] sm:leading-[20px] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap">
                    <p className="mb-0">v. Dzoragyugh, Armenia</p>
                  </div>
                </div>
              </div>

              {/* Column 3: Policies */}
              <div className="content-stretch flex flex-col gap-[24px] lg:gap-[24px] md:gap-[20px] sm:gap-[16px] items-start relative shrink-0 w-[154px] lg:w-[154px] md:w-[45%] sm:w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white tracking-[1.6px] lg:tracking-[1.6px] md:tracking-[1.4px] sm:tracking-[1.2px] uppercase w-full">
                    <p className="leading-[20px] lg:leading-[20px] md:leading-[18px] sm:leading-[16px] whitespace-pre-wrap">POLICIES</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-row flex-wrap gap-[18px] lg:gap-[18px] md:gap-[14px] sm:gap-[12px] items-start relative shrink-0 w-full">
                  <div
                    onClick={() => router.push('/privacy')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px] lg:leading-[24px] md:leading-[22px] sm:leading-[20px]">Privacy Policy</p>
                  </div>
                  <div
                    onClick={() => router.push('/terms')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px]">Terms & Conditions</p>
                  </div>
                  <div
                    onClick={() => router.push('/delivery-terms')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px]">Delivery Terms</p>
                  </div>
                  <div
                    onClick={() => router.push('/refund-policy')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px]">Refund Policy</p>
                  </div>
                </div>
              </div>

              {/* Column 4: Site Map */}
              <div className="content-stretch flex flex-col gap-[24px] lg:gap-[24px] md:gap-[20px] sm:gap-[16px] items-start relative shrink-0 w-[94px] lg:w-[94px] md:w-[45%] sm:w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[16.5px] lg:text-[16.5px] md:text-[15px] sm:text-[13px] text-white tracking-[1.4px] lg:tracking-[1.4px] md:tracking-[1.2px] sm:tracking-[1px] uppercase w-full">
                    <p className="leading-[20px] lg:leading-[20px] md:leading-[18px] sm:leading-[16px] whitespace-pre-wrap">SITE MAP</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-row flex-wrap gap-[18px] lg:gap-[18px] md:gap-[14px] sm:gap-[12px] items-start relative shrink-0 w-full">
                  <div
                    onClick={() => router.push('/about')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] lg:text-[18px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px] lg:leading-[24px] md:leading-[22px] sm:leading-[20px]">About Us</p>
                  </div>
                  <div
                    onClick={() => router.push('/contact')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px]">Contact</p>
                  </div>
                  <div
                    onClick={() => router.push('/products')}
                    className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px]">Shop</p>
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
                  <p className="leading-[16px] lg:leading-[16px] md:leading-[14px] sm:leading-[12px]">Copyright © 2024 | New Aqua LLC | All Rights Reserved</p>
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
      <div className="absolute flex top-[44.44%] right-[66.93%] bottom-[43.57%] left-0 items-center justify-center overflow-hidden">
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
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>

      {/* Image 5 - Decorative Element */}
      <div className="absolute flex items-center justify-center left-[534px] top-[1374px] size-[163px]">
        <div className="relative rounded-[320px] size-full">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Image 5" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={imgImage5} />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>

      {/* Image 11 - Decorative Element */}
      <div className="absolute flex items-center justify-center left-[1603px] top-[1233px] size-[244px]">
        <div className="relative rounded-[320px] size-full">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Image 11" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={imgImage11} />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
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
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>

      <div className="absolute flex top-[39.38%] right-[69.74%] bottom-[50.88%] left-0 items-center justify-center overflow-hidden">
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
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
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
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>

      <div className="absolute flex top-[50.45%] right-[77.71%] bottom-[39.8%] left-0 items-center justify-center overflow-hidden">
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
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>

      <div className="absolute flex top-[55.45%] right-[79.79%] bottom-[38.23%] left-0 items-center justify-center overflow-hidden">
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
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>

      {/* Featured Products Section Decorative Elements */}
      <div className="absolute flex top-0 right-[72.03%] bottom-[66.22%] left-[6.56%] items-center justify-center overflow-hidden">
        <div className="relative rounded-[320px] size-[290.785px]">
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
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>

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
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
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
            <p className="leading-[50px] mb-0 text-[66px]">Pure</p>
            <p className="leading-[50px] mb-0 text-[66px]">energy</p>
            <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] text-[16px]">drawn from nature, captured in every drop.</p>
          </div>
          <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[29.76%_62.8%_62.88%_0] justify-center leading-[0] text-[#09c1ff] text-[66px] tracking-[-0.9px] uppercase whitespace-nowrap">
            <p className="leading-[50px]">balance</p>
          </div>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-normal inset-[22.39%_62.8%_72.01%_7.99%] justify-center leading-[19px] text-[#0f172a] text-[16px] text-right tracking-[-0.9px] uppercase whitespace-nowrap">
          <p className="mb-0">Crystal clarity that refreshes</p>
          <p>the body and restores</p>
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

      <div className="absolute bottom-[17.71%] left-1/2 top-[80.63%] translate-x-[-50%] w-[78px]">
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
                placeholder="Search products..."
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
  );
}
