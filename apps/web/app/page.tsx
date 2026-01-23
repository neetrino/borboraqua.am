'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { figmaImages } from '../config/figma-images';
import { getImageOverlayStyles, getOverlayDivStyles } from '../config/figma-image-overlays';
import { apiClient } from '../lib/api-client';
import { formatPrice, getStoredCurrency } from '../lib/currency';
import { getStoredLanguage } from '../lib/language';
import { useAuth } from '../lib/auth/AuthContext';
import { CartIcon } from '../components/icons/CartIcon';

// Figma MCP Image URLs - Updated from latest Figma design (2025-01-16)
const imgBorborAguaLogoColorB2024Colored1 = "https://www.figma.com/api/mcp/asset/b106fddf-ddb7-4708-ad7a-7cb2873cb7c9";
const imgDanielSinocaAancLsb0SU0Unsplash1 = "https://www.figma.com/api/mcp/asset/4871f446-450c-4331-8d45-fc09cffddcdf";
const imgDanielSinocaAancLsb0SU0Unsplash2 = "https://www.figma.com/api/mcp/asset/bc03b396-c7f6-4c82-8e98-d5787b0a9f5f";
const img = "https://www.figma.com/api/mcp/asset/9bb170f3-78f7-41dc-a30d-f7aba37fbea1";
const img1 = "https://www.figma.com/api/mcp/asset/3505a6b7-91e7-402f-a08d-2db92f4d6d86";
const img2 = "https://www.figma.com/api/mcp/asset/d2d605c5-1270-4604-96ed-7891bee71207";
const img3 = "https://www.figma.com/api/mcp/asset/2d6b9be1-5538-4773-b058-136917510437";
const img6Eb12990A37F43358E368Af827A9C8A5Png1 = "https://www.figma.com/api/mcp/asset/997a7a91-9b2c-4abb-b622-b9cea1e370cc";
const imgLogo1 = "https://www.figma.com/api/mcp/asset/f944f29e-d08d-48db-92a2-188ad56f05bd";
const imgSas20Logo1 = "https://www.figma.com/api/mcp/asset/c1185ab0-5e7b-4b0b-9deb-a9198c674de5";
const img5 = "https://www.figma.com/api/mcp/asset/b2aad9d2-8b80-4e27-a38f-82458f66f9fd";
const img6 = "https://www.figma.com/api/mcp/asset/512a12fb-f4a9-4cf0-9336-14e07b49ce82";
const img17 = "https://www.figma.com/api/mcp/asset/15c9e520-a101-4e13-804c-6fe7185257de";
const imgFrame3292 = "https://www.figma.com/api/mcp/asset/f7896520-8d84-451d-b191-3918fc96568c";
const imgEllipse41 = "https://www.figma.com/api/mcp/asset/43ab67eb-2375-4a42-aa17-a9e5a1949fb1";
const imgShape = "https://www.figma.com/api/mcp/asset/8b35da42-18d0-4050-bbe7-5222c75f464b";
const imgEllipse44 = "https://www.figma.com/api/mcp/asset/d8dfe400-7d4b-4c94-bd51-617fe492e640";
const imgShape1 = "https://www.figma.com/api/mcp/asset/ac78c9b1-acff-459c-be01-77e84c3c1b7e";
const imgShape2 = "https://www.figma.com/api/mcp/asset/90f42685-0444-4f5f-8e9d-37eac5a9e2f2";
const imgEllipse42 = "https://www.figma.com/api/mcp/asset/5e6292ef-d0f8-47e3-828f-4727614e7e4d";
const imgShape3 = "https://www.figma.com/api/mcp/asset/379c6514-3b13-4734-a155-88259968a700";
const imgEllipse43 = "https://www.figma.com/api/mcp/asset/0259f224-0c94-469b-af5c-b1f43dcfe496";
const imgGroup2105 = "https://www.figma.com/api/mcp/asset/41b6e81d-4948-41fd-8e45-f0771ba49400";
const imgIcon = "https://www.figma.com/api/mcp/asset/1f3f805e-d342-492d-b62f-0ee10262d176";
const img4 = "https://www.figma.com/api/mcp/asset/3790c683-0678-49d5-9066-e1597763c958";
const imgIcon1 = "https://www.figma.com/api/mcp/asset/308e9fce-055c-4fe7-b4ec-d6e5ac91d1ef";
const imgVector4 = "https://www.figma.com/api/mcp/asset/da0e029f-e6ab-4c9a-ad7c-202c72ab4c82";
const imgVector5 = "https://www.figma.com/api/mcp/asset/4bd887f5-a117-4a36-8165-ec4d5e48d691";
const imgVector6 = "https://www.figma.com/api/mcp/asset/b3518300-1756-4faa-a6f1-ce08fa895783";
const imgVector7 = "https://www.figma.com/api/mcp/asset/28faa81b-c5cd-4902-b1a9-c4ad891ee203";
const imgVector = "https://www.figma.com/api/mcp/asset/bf9313e8-ec3b-4ca9-a524-37d8485d4e9d";
const imgIcon2 = "https://www.figma.com/api/mcp/asset/2cd7e92d-245f-4279-92e8-d685f93b2aa4";
const imgSvg = "https://www.figma.com/api/mcp/asset/4d0d1287-b954-451a-a592-5eba28116160";
const imgSvg1 = "https://www.figma.com/api/mcp/asset/fe4a6a3b-4ef9-43e8-8693-c1e538283c41";
const imgGroup = "https://www.figma.com/api/mcp/asset/86098cb5-762b-47ef-8350-9c44d61ae29f";
const imgLink = "https://www.figma.com/api/mcp/asset/c0e72a8f-d8d8-4b2d-ac1f-645001a4b42d";
const imgGroup2122 = "https://www.figma.com/api/mcp/asset/6d343979-117f-4f25-9dba-148f9b14abd4";
const imgGroup2121 = "https://www.figma.com/api/mcp/asset/2e931b4d-2931-4235-8c2b-a2d5f1806711";
const imgGroup2124 = "https://www.figma.com/api/mcp/asset/84ea6876-17b8-4b9b-9851-59f2422494d4";
const imgGroup2123 = "https://www.figma.com/api/mcp/asset/072e9c63-2457-4c22-94fc-276add2dff2b";
const img7 = "https://www.figma.com/api/mcp/asset/5e5a01ec-d5cb-498f-8a9d-82c50311da10";
const img8 = "https://www.figma.com/api/mcp/asset/f32df2b9-d44d-4b51-b3d8-85425e86c34b";
const img9 = "https://www.figma.com/api/mcp/asset/b9cead35-a280-40ac-a001-1dad7373d7b4";
const img10 = "https://www.figma.com/api/mcp/asset/7baa3994-4292-4f4e-90e4-fe1cc5af96aa";
const img11 = "https://www.figma.com/api/mcp/asset/633f76bb-f52a-4959-b35b-401335056328";
const img12 = "https://www.figma.com/api/mcp/asset/27e6bac6-d566-4b22-b028-292442439ef7";
const img13 = "https://www.figma.com/api/mcp/asset/45f9a2ad-6701-4905-a022-65619c9caa48";
const img13Decorative = "https://www.figma.com/api/mcp/asset/cc815d32-3501-4133-9848-3d322d6a7db8";
const img14 = "https://www.figma.com/api/mcp/asset/74737aa6-9360-47e1-979e-42223e542b5e";
const img15 = "https://www.figma.com/api/mcp/asset/babaf6e8-f74e-4a66-ab54-0fb95309f75b";
const img16 = "https://www.figma.com/api/mcp/asset/1ef0b957-39c5-4b9d-9afd-b90d72ff4570";
const img18 = "https://www.figma.com/api/mcp/asset/65825bce-8684-4e63-8d01-3dca9111914a";
// Image 5 and Image 11 for decorative bubbles with specific colors from Figma
const imgImage5 = "https://www.figma.com/api/mcp/asset/7de49827-29c4-470d-a625-3f8a0d6a1a61";
const imgImage11 = "https://www.figma.com/api/mcp/asset/ea475088-694e-4438-9b36-cd352182705b";

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
  const { isLoggedIn } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for featured products
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Apply scaling based on viewport width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const viewportWidth = window.innerWidth;
        const scale = Math.min(viewportWidth / 1920, 1);
        // Use translateX(-50%) to center, then scale
        containerRef.current.style.left = '50%';
        containerRef.current.style.transform = `translateX(-50%) scale(${scale})`;
        containerRef.current.style.transformOrigin = 'top center';
        containerRef.current.style.position = 'relative';
        containerRef.current.style.overflowX = 'hidden';
        // Adjust margin-bottom to compensate for scaled height
        if (scale < 1) {
          containerRef.current.style.marginBottom = `${6637 * (1 - scale)}px`;
        } else {
          containerRef.current.style.marginBottom = '0';
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Debug: Log carousel index changes
  useEffect(() => {
    console.log('🔄 [CAROUSEL] Index changed to:', carouselIndex, 'Total products:', featuredProducts.length);
    console.log('🔄 [CAROUSEL] Showing products:', featuredProducts.slice(carouselIndex, carouselIndex + 3).map(p => p.title));
  }, [carouselIndex, featuredProducts]);
  
  // State for header navigation
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
   * Handle carousel navigation
   */
  const handlePreviousProducts = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🔄 [CAROUSEL] Previous clicked, current index:', carouselIndex);
    setCarouselIndex((prevIndex) => {
      const newIndex = prevIndex - 3;
      const totalProducts = featuredProducts.length;
      console.log('🔄 [CAROUSEL] Previous - prevIndex:', prevIndex, 'newIndex:', newIndex, 'totalProducts:', totalProducts);
      // If we go below 0, loop to the end
      if (newIndex < 0) {
        const lastGroupStart = Math.floor((totalProducts - 1) / 3) * 3;
        console.log('🔄 [CAROUSEL] Looping to end, lastGroupStart:', lastGroupStart);
        return lastGroupStart;
      }
      return newIndex;
    });
  };

  const handleNextProducts = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🔄 [CAROUSEL] Next clicked, current index:', carouselIndex);
    setCarouselIndex((prevIndex) => {
      const newIndex = prevIndex + 3;
      const totalProducts = featuredProducts.length;
      console.log('🔄 [CAROUSEL] Next - prevIndex:', prevIndex, 'newIndex:', newIndex, 'totalProducts:', totalProducts);
      // If we exceed the total, loop back to start
      if (newIndex >= totalProducts) {
        console.log('🔄 [CAROUSEL] Looping to start');
        return 0;
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

  // Footer is at top-[6061px] with h-[576px], so total height = 6061 + 576 = 6637px
  // Using exact pixel height from Figma with responsive scaling
  return (
    <div 
      ref={containerRef}
      className="bg-white relative w-[1920px] h-[6637px] home-page-container"
      style={{
        display: 'block',
        transformOrigin: 'top center',
      }}
    >
      {/* Header Section - Navigation Bar */}
      <div className="fixed bg-[rgba(255,255,255,0.04)] backdrop-blur-[10px] content-stretch flex flex-col h-[73px] items-center justify-center left-1/2 px-[38px] py-[16px] rounded-[70px] top-[64px] translate-x-[-50%] w-[1668px] z-50">
        <div className="content-stretch flex gap-[320px] h-[56px] items-center justify-center relative shrink-0">
          {/* Logo */}
          <div 
            onClick={() => router.push('/')}
            className="h-[31px] relative shrink-0 w-[101px] cursor-pointer"
          >
            <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgBorborAguaLogoColorB2024Colored1} />
          </div>
          
          {/* Navigation Menu */}
          <div className="content-stretch flex font-['Inter:Bold',sans-serif] font-bold gap-[74px] items-end justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white uppercase whitespace-nowrap">
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
          
          {/* Search Icon */}
          <div 
            onClick={() => setShowSearchModal(true)}
            className="h-[21px] relative shrink-0 w-[151.051px] cursor-pointer"
          >
            <div className="absolute inset-[-2.38%_0]">
              <img alt="Search" className="block max-w-none size-full" src={imgFrame3292} />
            </div>
          </div>
          
      
        </div>
      </div>

      {/* Background Gradient */}
      <div className="absolute bg-gradient-to-b blur-[50px] from-[#62b3e8] h-[1075px] left-1/2 to-[rgba(221,216,216,0.75)] top-0 translate-x-[-50%] w-[1920px]" />
      
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
      <div className="absolute content-stretch flex items-end justify-center left-[calc(50%+0.5px)] px-[24px] top-[528px] translate-x-[-50%] w-[1111px]">
        <div className="content-stretch flex flex-col gap-[24px] items-center justify-center relative shrink-0 w-[1106px]">
          {/* Experience Purity Label */}
          <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
            <div className="bg-white h-[2px] shrink-0 w-[48px]" />
            <div className="content-stretch flex flex-col items-start relative shrink-0">
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-white tracking-[1.4px] uppercase whitespace-nowrap">
                <p className="leading-[20px]">Experience Purity</p>
              </div>
            </div>
          </div>
          
          {/* Main Heading */}
          <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[96px] text-center text-white w-full">
              <p className="whitespace-pre-wrap">
                <span className="leading-[96px] text-white font-black">YOUR </span>
                <span className="font-['Montserrat',sans-serif] font-light leading-[96px] text-white">DAILY DOSE OF</span>
                <span className="leading-[96px]"> </span>
                <span className="leading-[96px] text-white font-black">FRESHNESS</span>
              </p>
            </div>
          </div>
          
          {/* Subtitle */}
          <div className="content-stretch flex flex-col items-center justify-center max-w-[512px] relative shrink-0 w-[512px]">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white whitespace-nowrap">
              <p className="leading-[32.5px]">Natural spring water</p>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="content-center flex flex-wrap gap-[0px_16px] h-[76px] items-center justify-center pt-[16px] relative shrink-0 w-full">
            <div 
              onClick={() => router.push('/products')}
              className="bg-[#1ac0fd] content-stretch flex flex-col h-[60px] items-center justify-center pl-[63px] pr-[61px] py-[16px] relative rounded-[9999px] shrink-0 w-[185px] cursor-pointer hover:bg-[#00b8e6] transition-colors"
            >
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">
                <p className="leading-[24px]">Shop Now</p>
              </div>
            </div>
            <div 
              onClick={() => router.push('/about')}
              className="bg-[rgba(0,0,0,0)] content-stretch flex flex-col h-[60px] items-center justify-center px-[40px] py-[16px] relative rounded-[9999px] shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[19px] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-[89px]">
                <p className="leading-[24px] whitespace-pre-wrap">Learn More</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Water Wave Graphic */}
      <div className="absolute h-[807px] left-0 top-[978px] w-[1920px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="Water Wave" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash1} />
        </div>
      </div>
      
      {/* Blurred Reflection */}
      <div className="absolute flex h-[807px] items-center justify-center left-1/2 top-[1741px] translate-x-[-50%] w-[1920px]">
        <div className="flex-none scale-y-[-100%]">
          <div className="blur-[2px] h-[807px] relative w-[1920px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img alt="Water Wave Reflection" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash1} />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements - Ellipses */}
      <div className="absolute h-[1124px] left-[calc(50%+953.5px)] top-[2396px] translate-x-[-50%] w-[1191px]">
        <div className="absolute inset-[-41.37%_-39.04%] figma-float-slow">
          <img alt="Ellipse" className="block max-w-none size-full" src={imgEllipse41} />
        </div>
      </div>
      
      <div className="absolute h-[1031px] left-1/2 top-[4834px] translate-x-[-50%] w-[1008px]">
        <div className="absolute inset-[-45.1%_-46.13%] figma-float">
          <img alt="Ellipse" className="block max-w-none size-full" src={imgEllipse44} />
        </div>
      </div>
      
      <div className="absolute h-[1124px] left-[calc(50%-1113.5px)] top-[3102px] translate-x-[-50%] w-[1191px]">
        <div className="absolute inset-[-41.37%_-39.04%] figma-float-slow">
          <img alt="Ellipse" className="block max-w-none size-full" src={imgEllipse42} />
        </div>
      </div>
      
      <div className="absolute h-[1124px] left-[calc(50%+986px)] top-[3116px] translate-x-[-50%] w-[1422px]">
        <div className="absolute inset-[-41.37%_-32.7%] figma-float">
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
      <div className="absolute h-[1175px] left-1/2 top-[1278px] translate-x-[-50%] w-[1920px]">
        <div className="absolute h-[976px] left-[192px] right-[192px] top-[139px]">
          {/* Section Header */}
          <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[24px] right-[24px] top-[-37px]">
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[70px] text-center text-white tracking-[-0.9px] uppercase whitespace-nowrap">
                <p className="leading-[40px]">FEATURED PRODUCTS</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
                <p className="leading-[24px]">Premium water designed for modern living</p>
              </div>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="absolute h-[736.83px] left-[24px] right-[24px] top-[166px]">
            {productsLoading ? (
              // Loading state - show placeholder
              <>
                <div className="absolute bg-transparent inset-[-12px_-11.66px_12px_1025px]">
                  <div className="absolute h-[563px] left-[98.83px] top-[12.91px] w-[277px] bg-gray-300 animate-pulse rounded" />
                  <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[9px] pb-[16px] px-[16px] right-[9px] top-[599.91px]">
                    <div className="h-4 bg-gray-300 animate-pulse rounded w-3/4" />
                    <div className="h-6 bg-gray-300 animate-pulse rounded w-1/3" />
                  </div>
                </div>
                <div className="absolute bg-transparent content-stretch flex flex-col gap-[24px] inset-[-12px_500.33px_12px_513px] items-center justify-center p-[8px]">
                  <div className="h-[564px] w-[205px] bg-gray-300 animate-pulse rounded" />
                </div>
                <div className="absolute bg-transparent inset-[-12px_1013.34px_12px_0]">
                  <div className="absolute h-[508px] left-[137px] top-[53px] w-[182px] bg-gray-300 animate-pulse rounded" />
                </div>
              </>
            ) : featuredProducts.length > 0 ? (
              // Render actual products - show 3 at a time based on carouselIndex
              (() => {
                const visibleProducts = featuredProducts.slice(carouselIndex, carouselIndex + 3);
                console.log('🔄 [CAROUSEL] Rendering products - carouselIndex:', carouselIndex, 'visibleProducts:', visibleProducts.length, 'total:', featuredProducts.length);
                return visibleProducts.map((product, relativeIndex) => {
                  const index = carouselIndex + relativeIndex;
                const currency = getStoredCurrency();
                const formattedPrice = formatPrice(product.price, currency);
                
                // Product positioning based on relativeIndex (matching original layout)
                // Always use relativeIndex (0, 1, 2) for the 3 visible products
                const positions = [
                  { className: "inset-[-12px_-11.66px_12px_1025px]", imageClass: "h-[563px] left-[98.83px] top-[12.91px] w-[277px]", imageStyle: "h-[111.44%] left-[-62.35%] max-w-none top-0 w-[226.62%]", contentClass: "left-[9px] pb-[16px] px-[16px] right-[9px] top-[599.91px]" },
                  { className: "inset-[-12px_500.33px_12px_513px]", imageClass: "h-[564px] w-[205px]", imageStyle: "h-[100.18%] left-[-87.8%] max-w-none top-[-0.09%] w-[275.61%]", contentClass: "pb-[16px] px-[16px]" },
                  { className: "inset-[-12px_1013.34px_12px_0]", imageClass: "h-[508px] left-[137px] top-[53px] w-[182px]", imageStyle: "h-[110.66%] left-[-104.92%] max-w-none top-[-5.74%] w-[309.84%]", contentClass: "left-[16px] top-[600px] w-[424.66px]" }
                ];
                
                const pos = positions[relativeIndex] || positions[0];
                const isSecondProduct = relativeIndex === 1;
                const isThirdProduct = relativeIndex === 2;
                
                return (
                  <div 
                    key={product.id} 
                    onClick={() => router.push(`/products/${product.slug}`)}
                    className={`absolute bg-transparent ${pos.className} ${isSecondProduct ? 'content-stretch flex flex-col gap-[24px] items-center justify-center p-[8px]' : ''} cursor-pointer product-card-hover`}
                  >
                    {isThirdProduct ? (
                      <div className="absolute h-[714px] left-[9px] right-[9px] top-0">
                        <div className={`absolute ${pos.imageClass}`}>
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {product.image ? (
                              <img 
                                alt={product.title} 
                                className={`absolute ${pos.imageStyle} object-contain product-image-hover`} 
                                src={product.image} 
                              />
                            ) : (
                              <div className={`absolute ${pos.imageStyle} bg-gray-300`} />
                            )}
                          </div>
                        </div>
                        <div className={`absolute content-stretch flex h-[44px] items-end justify-between ${pos.contentClass}`}>
                          <div className="content-stretch flex flex-col items-start relative shrink-0">
                            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                              <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] text-white">
                                <p className="leading-[28px]">{product.title}</p>
                              </div>
                            </div>
                          </div>
                          <div className="content-stretch flex flex-col items-start relative shrink-0">
                            <div className="flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[20px] whitespace-nowrap">
                              <p className="leading-[28px]">{formattedPrice}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={!product.inStock || addingToCart.has(product.id)}
                          className="absolute bg-[#00d1ff] content-stretch flex h-[48px] items-center justify-center left-[16px] py-[12px] rounded-[34px] top-[660px] w-[424.66px] hover:bg-[#00b8e6] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
                            <p className="leading-[24px]">
                              {addingToCart.has(product.id) ? 'Adding...' : 'Add to Cart'}
                            </p>
                          </div>
                        </button>
                      </div>
                    ) : isSecondProduct ? (
                      <>
                        <div className={`h-[564px] relative shrink-0 w-[205px]`}>
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {product.image ? (
                              <img 
                                alt={product.title} 
                                className={`absolute ${pos.imageStyle} object-contain product-image-hover`} 
                                src={product.image} 
                              />
                            ) : (
                              <div className={`absolute ${pos.imageStyle} bg-gray-300`} />
                            )}
                          </div>
                        </div>
                        <div className="relative shrink-0 w-[456.67px]">
                          <div className="content-stretch flex flex-col gap-[16px] items-start pb-[16px] px-[16px] relative w-full">
                            <div className="content-stretch flex items-end justify-between relative shrink-0 w-full">
                              <div className="content-stretch flex flex-col items-start relative shrink-0">
                                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                                  <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] text-white">
                                    <p className="leading-[28px]">{product.title}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="content-stretch flex flex-col items-start relative shrink-0">
                                <div className="flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[20px] whitespace-nowrap">
                                  <p className="leading-[28px]">{formattedPrice}</p>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              disabled={!product.inStock || addingToCart.has(product.id)}
                              className="bg-[#00d1ff] content-stretch flex items-center justify-center py-[12px] relative rounded-[34px] shrink-0 w-full hover:bg-[#00b8e6] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
                                <p className="leading-[24px]">
                                  {addingToCart.has(product.id) ? 'Adding...' : 'Add to Cart'}
                                </p>
                              </div>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`absolute ${pos.imageClass}`}>
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {product.image ? (
                              <img 
                                alt={product.title} 
                                className={`absolute ${pos.imageStyle} object-contain product-image-hover`} 
                                src={product.image} 
                              />
                            ) : (
                              <div className={`absolute ${pos.imageStyle} bg-gray-300`} />
                            )}
                          </div>
                        </div>
                        <div className={`absolute content-stretch flex flex-col gap-[16px] items-start ${pos.contentClass}`}>
                          <div className="content-stretch flex items-end justify-between pr-[0.01px] relative shrink-0 w-full">
                            <div className="content-stretch flex flex-col items-start relative shrink-0">
                              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                                <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] text-white">
                                  <p className="leading-[28px]">{product.title}</p>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start relative shrink-0">
                              <div className="flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[20px] whitespace-nowrap">
                                <p className="leading-[28px]">{formattedPrice}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            disabled={!product.inStock || addingToCart.has(product.id)}
                            className="bg-[#00d1ff] content-stretch flex items-center justify-center py-[12px] relative rounded-[34px] shrink-0 w-full hover:bg-[#00b8e6] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
                              <p className="leading-[24px]">
                                {addingToCart.has(product.id) ? 'Adding...' : 'Add to Cart'}
                              </p>
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              });
              })()
            ) : (
              // Fallback to original hardcoded products if no products loaded
              <>
                <div className="absolute bg-transparent inset-[-12px_-11.66px_12px_1025px]">
                  <div className="absolute h-[563px] left-[98.83px] top-[12.91px] w-[277px]">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <img alt="Product 19L" className="absolute h-[111.44%] left-[-62.35%] max-w-none top-0 w-[226.62%]" src={img1} />
                    </div>
                  </div>
                  <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[9px] pb-[16px] px-[16px] right-[9px] top-[599.91px]">
                    <div className="content-stretch flex items-end justify-between pr-[0.01px] relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col items-start relative shrink-0">
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                          <div className="flex flex-col font-['Montserrat:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] text-white whitespace-nowrap">
                            <p className="leading-[28px]">Natural spring water</p>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-start relative shrink-0">
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
              </>
            )}
            
            {/* Navigation Arrows - Only show if we have more than 3 products */}
            {featuredProducts.length > 3 && (
              <div className="absolute content-stretch flex h-[41px] items-center justify-between left-[calc(50%-0.5px)] top-[295px] translate-x-[-50%] w-[1621px]">
                {/* Debug indicator - remove in production */}
                <div className="absolute left-1/2 top-[-30px] translate-x-[-50%] text-white text-xs bg-black/50 px-2 py-1 rounded z-20">
                  Index: {carouselIndex} / Total: {featuredProducts.length}
                </div>
                <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
                  <div 
                    onClick={(e) => {
                      console.log('🔄 [CAROUSEL] Previous button clicked!');
                      handlePreviousProducts(e);
                    }}
                    className="bg-[rgba(0,0,0,0)] border-[0.5px] border-[rgba(255,255,255,0.49)] border-solid col-1 content-stretch flex flex-col items-center justify-center ml-0 mt-0 px-[8.5px] py-[6.5px] relative rounded-[9999px] row-1 size-[56px] cursor-pointer hover:bg-white/10 transition-colors z-10"
                  >
                    <div className="relative shrink-0 pointer-events-none">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                        <div className="flex items-center justify-center relative shrink-0">
                          <div className="flex-none scale-y-[-100%]">
                            <div className="h-[28px] relative w-[24.02px]">
                              <img alt="Arrow" className="block max-w-none size-full" src={imgIcon} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center relative shrink-0">
                  <div className="flex-none rotate-[180deg] scale-y-[-100%]">
                    <div 
                      onClick={(e) => {
                        console.log('🔄 [CAROUSEL] Next button clicked!');
                        handleNextProducts(e);
                      }}
                      className="bg-[rgba(0,0,0,0)] border-[0.5px] border-[rgba(255,255,255,0.49)] border-solid content-stretch flex flex-col items-center justify-center px-[8.5px] py-[6.5px] relative rounded-[9999px] size-[56px] cursor-pointer hover:bg-white/10 transition-colors z-10"
                    >
                      <div className="relative shrink-0 pointer-events-none">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                          <div className="flex items-center justify-center relative shrink-0">
                            <div className="flex-none scale-y-[-100%]">
                              <div className="h-[28px] relative w-[24.02px]">
                                <img alt="Arrow" className="block max-w-none size-full" src={imgIcon} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Pagination Dots */}
          <div className="absolute contents left-1/2 top-[920px] translate-x-[-50%]">
            <div className="absolute bg-[#e2e8f0] left-[calc(50%-17px)] rounded-[9999px] size-[6px] top-[920px] translate-x-[-50%]" />
            <div className="absolute bg-[#00d1ff] h-[6px] left-1/2 rounded-[9999px] top-[920px] translate-x-[-50%] w-[16px]" />
            <div className="absolute bg-[#e2e8f0] left-[calc(50%+17px)] rounded-[9999px] size-[6px] top-[920px] translate-x-[-50%]" />
          </div>
          
          {/* View All Products Button */}
          <div className="absolute content-stretch flex flex-col items-center left-[24px] right-[24px] top-[976px]">
            <div 
              onClick={() => router.push('/products')}
              className="border-2 border-[#e2e8f0] border-solid content-stretch flex gap-[8px] items-center px-[34px] py-[12px] relative rounded-[9999px] shrink-0 cursor-pointer hover:border-[#00d1ff] hover:bg-[#00d1ff]/5 transition-all"
            >
              <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[16px] text-center whitespace-nowrap">
                <p className="leading-[24px]">View All Products</p>
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
          <div className="absolute content-stretch flex items-start justify-center left-1/2 top-[59px] translate-x-[-50%] w-[1488px]">
            <div className="bg-[#00d1ff] h-[5px] rounded-[30px] shrink-0 w-[90px]" />
          </div>
        </div>
      </div>

      {/* Water Energy Section */}
      <div className="absolute content-stretch flex flex-col gap-[35px] items-start left-1/2 top-[2606px] translate-x-[-50%] w-[1488px]">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[70px] text-center tracking-[-0.9px] uppercase w-[641px]">
              <p className="leading-[40px] whitespace-pre-wrap">WATER ENERGY</p>
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
      <div className="absolute h-[343px] left-[729px] top-[3570px] w-[794px]">
        <div className="absolute bg-[#1ac0fd] inset-0 rounded-[37px]" />
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[65.89%_3.9%_22.45%_69.14%] justify-center leading-[0] text-[96px] text-center text-white tracking-[-0.9px] uppercase whitespace-nowrap">
          <p className="leading-[40px]">98%</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[12.83%_29.35%_58.02%_5.29%] justify-center leading-[50px] text-[46px] text-white tracking-[-0.9px] uppercase whitespace-nowrap">
          <p className="mb-0">Pure spring water</p>
          <p className="font-['Montserrat',sans-serif] font-light">from Armenia</p>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-medium inset-[83.67%_3.9%_9.33%_82.24%] italic justify-center leading-[0] text-[16px] text-center text-white whitespace-nowrap">
          <p className="leading-[24px]">Natura Source</p>
        </div>
      </div>
      
      {/* White Card (100%) */}
      <div className="absolute h-[343px] left-[393px] top-[3931px] w-[795px]">
        <div className="absolute bg-white inset-0 rounded-[37px]" />
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[69.68%_60%_18.66%_7.42%] justify-center leading-[0] text-[#0f172a] text-[96px] text-center tracking-[-0.9px] uppercase whitespace-nowrap">
          <p className="leading-[40px]">100%</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-black inset-[12.83%_5.28%_58.02%_22.26%] justify-center leading-[50px] text-[#00d1ff] text-[46px] text-right tracking-[-0.9px] uppercase whitespace-nowrap">
          <p className="mb-0">Balanced hydration</p>
          <p className="font-['Montserrat',sans-serif] font-light">every day</p>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-medium inset-[53.94%_78.24%_39.07%_7.42%] italic justify-center leading-[0] text-[#00d1ff] text-[16px] text-center whitespace-nowrap">
          <p className="leading-[24px]">Clean Minerals</p>
        </div>
      </div>
      
      {/* Side Images */}
      <div className="absolute h-[343px] left-[393px] top-[3570px] w-[306px]">
        <div className="absolute inset-0 rounded-[37px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[37px]">
            <img alt="Screenshot" className="absolute h-[149.05%] left-[-32.81%] max-w-none top-[-32.36%] w-[132.81%]" src={img5} />
          </div>
        </div>
      </div>
      
      <div className="absolute h-[350px] left-[1215px] top-[3924px] w-[308px]">
        <div className="absolute inset-0 rounded-[37px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[37px]">
            <img alt="Screenshot" className="absolute h-[101.64%] left-[-6.77%] max-w-none top-[-1.52%] w-[113.53%]" src={img6} />
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="absolute content-stretch flex flex-col gap-[32px] items-start left-[205px] top-[4422px] w-[1488px]">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[70px] text-center tracking-[-0.9px] uppercase whitespace-nowrap">
              <p className="leading-[40px]">Why Choose Us</p>
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-start justify-center relative shrink-0 w-full">
          <div className="bg-[#00d1ff] h-[5px] rounded-[30px] shrink-0 w-[90px]" />
        </div>
      </div>

      {/* Why Choose Us Cards */}
      {/* Card 1: Rich in Minerals */}
      <div className="absolute h-[286px] left-[730px] top-[4661px] w-[375px]">
        <div className="absolute bg-white inset-[18.18%_0_0_0] rounded-[37px]" />
        <div className="absolute aspect-[100/100] left-[34.13%] right-[34.93%] top-0">
          <div className="absolute inset-[9.48%_-14.22%_18.97%_34.91%]">
            <div className="absolute inset-0">
              <img alt="PC Icon" className="block max-w-none size-full" src={img13} />
            </div>
          </div>
          <div className="absolute inset-[29.31%_16.81%_0_9.91%]">
            <div className="absolute inset-[-3.66%_-4.71%_-6.1%_-4.71%]">
              <img alt="Glass" className="block max-w-none size-full" src={img14} />
            </div>
          </div>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[61.19%_13.33%_22.03%_13.6%] justify-center leading-[24px] not-italic text-[#64748b] text-[16px] text-center whitespace-nowrap">
          <p className="mb-0">Rich in Natural Minerals that provide</p>
          <p>valuable health benefits.</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[49.3%_24%_40.91%_23.73%] justify-center leading-[0] text-[#0f172a] text-[20px] text-center uppercase whitespace-nowrap">
          <p className="leading-[28px]">RICH IN MINERALS</p>
        </div>
      </div>
      
      {/* Card 2: Non-Carbonated */}
      <div className="absolute h-[272px] left-[217px] top-[5086px] w-[375px]">
        <div className="absolute bg-white inset-[13.97%_0_0_0] rounded-[37px]" />
        <div className="absolute aspect-[100/100] left-[37.07%] overflow-clip right-[32%] top-0">
          <div className="absolute inset-[10.22%_10.23%_61.04%_62.5%]">
            <div className="absolute inset-0">
              <img alt="Leaf" className="block max-w-none size-full" src={img7} />
            </div>
          </div>
          <div className="absolute inset-[16.22%_15.91%_6.5%_4.41%]">
            <div className="absolute inset-[-3.35%_-4.33%_-5.58%_-4.33%]">
              <img alt="Glass" className="block max-w-none size-full" src={img8} />
            </div>
          </div>
          <div className="absolute inset-[32.96%_31.82%_25.5%_35.23%]">
            <img alt="Top" className="block max-w-none size-full" src={img9} />
          </div>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[60.66%_13.33%_24.63%_13.6%] justify-center leading-[20px] not-italic text-[#64748b] text-[16px] text-center whitespace-nowrap">
          <p className="mb-0">Borbor Aqua does not infuse carbon</p>
          <p>dioxide in any of its bottled water.</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[46.69%_22.4%_43.01%_22.4%] justify-center leading-[0] text-[#0f172a] text-[20px] text-center uppercase whitespace-nowrap">
          <p className="leading-[28px]">NON-CARBONATED</p>
        </div>
      </div>
      
      {/* Card 3: No Artificial Ingredients */}
      <div className="absolute h-[278px] left-[1227px] top-[4932px] w-[375px]">
        <div className="absolute bg-white inset-[15.83%_0_0_0] rounded-[37px]" />
        <div className="absolute aspect-[100/100] left-[34.53%] right-[34.53%] top-0">
          <div className="absolute inset-[5.88%_-4.86%_26.15%_50.33%]">
            <img alt="Group" className="block max-w-none size-full" src={img10} />
          </div>
          <div className="absolute inset-[13.93%_8.94%_9.09%_8.94%]">
            <div className="absolute inset-[-3.36%_-4.2%_-5.6%_-4.2%]">
              <img alt="Glass" className="block max-w-none size-full" src={img11} />
            </div>
          </div>
          <div className="absolute inset-[39.77%_45.45%_20.45%_45.45%]">
            <img alt="Top" className="block max-w-none size-full" src={img12} />
          </div>
        </div>
        <div className="absolute flex flex-col font-['Inter',sans-serif] font-normal inset-[60.07%_10.4%_22.66%_10.67%] justify-center leading-[24px] not-italic text-[#64748b] text-[16px] text-center whitespace-nowrap">
          <p className="mb-0">Borbor Aqua does not include any</p>
          <p>artificial ingredients in its bottled water</p>
        </div>
        <div className="absolute flex flex-col font-['Montserrat',sans-serif] font-bold inset-[47.84%_11.2%_42.09%_10.93%] justify-center leading-[0] text-[#0f172a] text-[20px] text-center uppercase whitespace-nowrap">
          <p className="leading-[28px]">no artifical ingridients</p>
        </div>
      </div>

      {/* Trusted By Section */}
      <div className="absolute content-stretch flex flex-col h-[461px] items-start left-1/2 px-[192px] py-[80px] top-[5651px] translate-x-[-50%] w-[1920px]">
        <div className="h-[277px] max-w-[1536px] relative shrink-0 w-full">
          <div className="absolute content-stretch flex flex-col items-center left-[calc(50%+0.5px)] top-[-34px] translate-x-[-50%] w-[1441px]">
            <div className="flex flex-col font-['Montserrat',sans-serif] font-black justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[70px] text-center uppercase whitespace-nowrap">
              <p className="leading-[28px]">Trusted By</p>
            </div>
          </div>
          <div className="absolute content-stretch flex flex-col items-center left-[calc(50%+1px)] top-[37px] translate-x-[-50%] w-[1488px]">
            <div className="flex flex-col font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[16px] text-center uppercase whitespace-nowrap">
              <p className="leading-[16px]">Industry leading partners</p>
            </div>
          </div>
          <div className="absolute content-stretch flex gap-[184px] items-center left-[calc(50%+0.5px)] top-[96px] translate-x-[-50%]">
            <div className="h-[144px] relative shrink-0 w-[221px]">
              <img alt="Partner Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={img6Eb12990A37F43358E368Af827A9C8A5Png1} />
            </div>
            <div className="h-[68.253px] relative shrink-0 w-[246px]">
              <img alt="Partner Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgLogo1} />
            </div>
            <div className="h-[85px] relative shrink-0 w-[178px]">
              <img alt="Partner Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgSas20Logo1} />
            </div>
          </div>
          <div className="absolute content-stretch flex h-[49px] items-end justify-center left-[24px] pt-[32px] right-[24px] top-[202px]">
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
              <div className="bg-white col-1 ml-0 mt-0 rounded-[9999px] row-1 size-[6px]" />
              <div className="bg-[#00d1ff] col-1 h-[6px] ml-[12px] mt-0 rounded-[9999px] row-1 w-[16px]" />
              <div className="bg-white col-1 ml-[34px] mt-0 rounded-[9999px] row-1 size-[6px]" />
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <div className="absolute contents left-[134px] top-[calc(50%+50.25px)] translate-y-[-50%]">
            <div className="absolute contents left-[134px] top-[calc(50%+50.5px)] translate-y-[-50%]">
              <div className="absolute bg-[rgba(0,0,0,0)] border-[#eee] border-[0.5px] border-solid content-stretch flex flex-col items-center justify-center left-[134px] px-[8.5px] py-[6.5px] rounded-[9999px] top-[calc(50%+50.5px)] translate-y-[-50%]">
                <div className="relative shrink-0">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                    <div className="flex items-center justify-center relative shrink-0">
                      <div className="flex-none scale-y-[-100%]">
                        <div className="h-[28px] relative w-[24.02px]">
                          <img alt="Arrow" className="block max-w-none size-full" src={imgIcon1} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex items-center justify-center left-[1361px] top-[calc(50%+50px)] translate-y-[-50%]">
              <div className="flex-none rotate-[180deg] scale-y-[-100%]">
                <div className="bg-[rgba(0,0,0,0)] border-[#eee] border-[0.5px] border-solid content-stretch flex flex-col items-center justify-center px-[8.5px] py-[6.5px] relative rounded-[9999px]">
                  <div className="relative shrink-0">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                      <div className="flex items-center justify-center relative shrink-0">
                        <div className="flex-none scale-y-[-100%]">
                          <div className="h-[28px] relative w-[24.02px]">
                            <img alt="Arrow" className="block max-w-none size-full" src={imgIcon1} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute h-[576px] left-1/2 top-[6061px] translate-x-[-50%] w-[1920px] relative overflow-hidden">
        {/* Footer Background Image - daniel sinoca */}
        <div className="absolute blur-[0px] h-[819px] left-[calc(50%-14px)] top-[-224px] translate-x-[-50%] w-[1949px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="Footer Background" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash2} />
          </div>
        </div>
        {/* Dark overlay for better text readability */}
        <div className="absolute bg-[#0f172a]/90 inset-0" />
        <div className="absolute h-[449px] left-[calc(50%+0.5px)] top-[81px] translate-x-[-50%] w-[1611px] relative z-10">
          <div className="absolute content-stretch flex gap-[298px] items-start justify-start left-[calc(50%-16px)] top-0 translate-x-[-50%]">
            {/* Column 1: Logo + Description */}
            <div className="h-[312px] relative shrink-0 w-[339px]">
              <div className="content-stretch flex h-[34px] items-center left-0 top-0 w-[336px]">
                <div className="h-[34px] relative shrink-0 w-[112px]">
                  <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgBorborAguaLogoColorB2024Colored1} />
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start left-0 top-[58px] w-[336px]">
                <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-full">
                  <p className="leading-[26px] whitespace-pre-wrap">{`New Aqua LLC introduces its Natural Spring Bottled Water – Borbor Aqua. Our range of products consists of 0.25L, 0.33L, 0.5L, 1L, 5L & 19L water bottles. Our Natural spring bottled water is non-carbonated. It is Rich in Natural Minerals that provides valuable health benefits to everyone.`}</p>
                </div>
              </div>
              <div className="flex items-center gap-[8px] left-0 top-[268px] relative">
                <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#00d1ff] text-[16px] whitespace-nowrap">
                  <p className="leading-[24px]">More</p>
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
            <div className="content-stretch flex gap-[208px] items-start relative shrink-0">
              {/* Column 2: Contact */}
              <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[241px]">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-white tracking-[1.4px] uppercase w-full">
                    <p className="leading-[20px] whitespace-pre-wrap">CONTACT</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[249px]">
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div className="flex flex-col font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white whitespace-pre-wrap">
                      <p className="font-['Inter',sans-serif] font-bold mb-0">
                        <span className="leading-[24px]">{`Office: `}</span>
                        <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[24px] underline" href="tel:0037433000401">
                          <span className="[text-decoration-skip-ink:none] decoration-solid leading-[24px]">+374 33 000401</span>
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div className="flex flex-col font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                      <p className="font-['Inter',sans-serif] font-bold whitespace-pre-wrap">
                        <span className="leading-[24px]">{`Delivery: `}</span>
                        <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[24px] underline" href="tel:0037441012004">
                          <span className="[text-decoration-skip-ink:none] decoration-solid leading-[24px]">+374 41 012004</span>
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div className="flex flex-col font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                      <p className="font-['Inter',sans-serif] font-bold whitespace-pre-wrap">
                        <span className="leading-[24px]">{`Email: `}</span>
                        <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[24px] underline" href="mailto:borboraqua.am@gmail.com">
                          <span className="[text-decoration-skip-ink:none] decoration-solid leading-[24px]">info@borboraqua.am</span>
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[24px] not-italic relative shrink-0 text-[16px] text-white w-[228px] whitespace-pre-wrap">
                      <p className="mb-0">Location: 1412, Gegharkunik,</p>
                      <p className="mb-0">v. Dzoragyugh, Armenia</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Column 3: Policies */}
              <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[154px]">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-white tracking-[1.4px] uppercase w-full">
                    <p className="leading-[20px] whitespace-pre-wrap">POLICIES</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div 
                      onClick={() => router.push('/privacy')}
                      className="content-stretch flex items-start relative shrink-0 w-full cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                        <p className="leading-[24px] whitespace-pre-wrap">Privacy Policy</p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div 
                      onClick={() => router.push('/terms')}
                      className="content-stretch flex items-start relative shrink-0 w-full cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                        <p className="leading-[24px] whitespace-pre-wrap">Terms & Conditions</p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div 
                      onClick={() => router.push('/delivery-terms')}
                      className="content-stretch flex items-start relative shrink-0 w-full cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                        <p className="leading-[24px] whitespace-pre-wrap">Delivery Terms</p>
                      </div>
                    </div>
                  </div>
                  <div 
                    onClick={() => router.push('/refund-policy')}
                    className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="leading-[24px] whitespace-pre-wrap">Refund Policy</p>
                  </div>
                </div>
              </div>
              
              {/* Column 4: Site Map */}
              <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[94px]">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-white tracking-[1.4px] uppercase w-full">
                    <p className="leading-[20px] whitespace-pre-wrap">SITE MAP</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div 
                      onClick={() => router.push('/about')}
                      className="content-stretch flex items-start relative shrink-0 w-full cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                        <p className="leading-[24px] whitespace-pre-wrap">About Us</p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div 
                      onClick={() => router.push('/contact')}
                      className="content-stretch flex items-start relative shrink-0 w-full cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                        <p className="leading-[24px] whitespace-pre-wrap">Contact</p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div 
                      onClick={() => router.push('/products')}
                      className="content-stretch flex items-start relative shrink-0 w-full cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                        <p className="leading-[24px] whitespace-pre-wrap">Shop</p>
                      </div>
                    </div>
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
                <div className="col-1 ml-0 mt-0 relative row-1 size-[18px]">
                  <div className="absolute inset-[-5.56%]">
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
          <div className="absolute border-[#e2e8f0] border-solid border-t content-stretch flex items-center justify-between left-[24px] pt-[41px] top-[392px] w-[1488px]">
            <div className="relative shrink-0">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center relative">
                <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap">
                  <p className="leading-[16px]">Copyright © 2024 | New Aqua LLC | All Rights Reserved</p>
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
      <div className="absolute flex inset-[44.44%_66.93%_43.57%_-8.49%] items-center justify-center">
        <div className="relative rounded-[320px] size-[564.622px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Decorative" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
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
              <img alt="Decorative" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>
      
      <div className="absolute flex inset-[39.38%_-3.52%_50.88%_69.74%] items-center justify-center">
        <div className="relative rounded-[320px] size-[459px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Decorative" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>
      
      <div className="absolute flex inset-[43.7%_-7.39%_49.82%_84.95%] items-center justify-center">
        <div className="relative rounded-[320px] size-[304.957px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Decorative" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>
      
      <div className="absolute flex inset-[50.45%_-11.49%_39.8%_77.71%] items-center justify-center">
        <div className="relative rounded-[320px] size-[459px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Decorative" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>
      
      <div className="absolute flex inset-[55.45%_-1.7%_38.23%_79.79%] items-center justify-center">
        <div className="relative rounded-[320px] size-[297.625px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Decorative" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>

      {/* Featured Products Section Decorative Elements */}
      <div className="absolute flex inset-[-1.19%_72.03%_66.22%_6.56%] items-center justify-center">
        <div className="relative rounded-[320px] size-[290.785px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Decorative" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
            </div>
          </div>
          <div className="absolute bg-[rgba(0,132,255,0.15)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-overlay rounded-[900px]" />
        </div>
      </div>
      
      <div className="absolute flex inset-[-10.09%_-8.49%_55.65%_75.18%] items-center justify-center">
        <div className="relative rounded-[320px] size-[456.082px]">
          <div className="absolute backdrop-blur-[4px] bg-[rgba(118,179,233,0.1)] inset-[0.83%_1.25%_1.25%_1.25%] mix-blend-darken rounded-[770px]" />
          <div className="absolute inset-0 mix-blend-lighten rounded-[880px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[880px]">
              <img alt="Decorative" className="absolute left-[-14.37%] max-w-none size-[128.74%] top-[-14.67%]" src={img} />
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
              <div className="absolute inset-[15.61%_32.71%_66.56%_53.61%]">
                <div className="absolute inset-[-2.48%_-3.2%_-4.13%_-3.2%]">
                  <img alt="Glass" className="block max-w-none size-full" src={img18} />
                </div>
              </div>
              <div className="absolute inset-[54.8%_59.41%_27.38%_26.91%]">
                <div className="absolute inset-[-2.48%_-3.2%_-4.13%_-3.2%]">
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
