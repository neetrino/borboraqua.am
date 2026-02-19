'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredLanguage, setStoredLanguage, LANGUAGES, type LanguageCode } from '../lib/language';
import { useAuth } from '../lib/auth/AuthContext';
import { useTranslation } from '../lib/i18n-client';
import { HeaderCartIcon } from './icons/HeaderCartIcon';
import { SearchIcon } from './icons/SearchIcon';
import { LanguageIcon } from './icons/LanguageIcon';
import { ExitIcon } from './icons/ExitIcon';

// Image paths
const imgBorborAguaLogoColorB2024Colored1 = "/assets/home/imgBorborAguaLogoColorB2024Colored1.png";
// Footer/background wave PNG from Figma, saved locally in public/assets/home
const imgDanielSinocaAancLsb0SU0Unsplash1 = "/assets/home/banner/imgDanielWave.webp";
const imgIcon2 = "/assets/home/imgIcon2.svg";
const imgSvg = "/assets/home/imgSvg.svg";
const imgSvg1 = "/assets/home/imgSvg1.svg";
const imgGroup = "/assets/home/imgGroup.svg";
const imgLink = "/assets/home/imgLink.svg";
const imgGroup2122 = "/assets/home/imgGroup2122.svg";
const imgGroup2121 = "/assets/home/imgGroup2121.svg";
const imgGroup2124 = "/assets/home/imgGroup2124.svg";
const imgGroup2123 = "/assets/home/imgGroup2123.svg";

/**
 * Home Page Header Component
 * Custom header for home page with glassmorphism effect
 */
export function HomePageHeader() {
  const router = useRouter();
  const { isLoggedIn, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside for search modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchModalRef.current && !searchModalRef.current.contains(event.target as Node)) {
        setShowSearchModal(false);
      }
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

  const handleLanguageChange = (langCode: LanguageCode) => {
    setStoredLanguage(langCode);
    setShowLanguageMenu(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

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

  return (
    <>
      {/* Header Section - Navigation Bar - Hidden when search modal is open */}
      {!showSearchModal && (
        <div className="fixed bg-[rgba(255,255,255,0.32)] backdrop-blur-[15px] content-stretch flex flex-col h-[65px] md:h-[60px] sm:h-[50px] items-center justify-center left-1/2 px-[32px] md:px-[24px] sm:px-[16px] py-[14px] md:py-[12px] sm:py-[8px] rounded-[60px] md:rounded-[50px] sm:rounded-[40px] top-[56px] md:top-[32px] sm:top-[16px] translate-x-[-50%] w-[1200px] lg:w-[1200px] md:w-[90%] sm:w-[95%] z-[150] border border-[rgba(255,255,255,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_60px_rgba(98,179,232,0.15)]">
        <div className="content-stretch flex gap-[160px] lg:gap-[160px] md:gap-[120px] sm:gap-[16px] h-[50px] md:h-[44px] sm:h-[36px] items-center justify-center relative shrink-0">
          {/* Logo */}
          <div
            onClick={() => router.push('/')}
            className="h-[31px] md:h-[26px] sm:h-[22px] relative shrink-0 w-[101px] md:w-[85px] sm:w-[72px] cursor-pointer"
          >
            <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgBorborAguaLogoColorB2024Colored1} />
          </div>

          {/* Navigation Menu */}
          <div className="content-stretch flex font-['Inter:Bold',sans-serif] font-bold gap-[60px] lg:gap-[60px] md:gap-[24px] sm:gap-[12px] items-end justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-[#151e21] uppercase whitespace-nowrap sm:hidden md:flex">
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
            <div
              onClick={() => router.push('/delivery-terms')}
              className="flex flex-col justify-center relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px]">{t('home.navigation.delivery')}</p>
            </div>
          </div>

          {/* Header Icons - Separate Vector Groups */}
          <div className="content-stretch flex gap-[28px] lg:gap-[28px] md:gap-[20px] sm:gap-[12px] items-center justify-center relative shrink-0">
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
            </div>

            {/* Language Icon */}
            <div className="relative shrink-0" ref={languageMenuRef}>
              <div
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="h-[20px] md:h-[18px] sm:h-[16px] w-[20px] md:w-[18px] sm:w-[16px] relative cursor-pointer flex items-center justify-center"
              >
                <LanguageIcon size={20} className="brightness-0" />
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

            {/* Login/Logout Icon with User Menu */}
            {isLoggedIn ? (
              <div className="relative shrink-0" ref={userMenuRef}>
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-[20px] md:h-[18px] sm:h-[16px] w-[20px] md:w-[18px] sm:w-[16px] relative cursor-pointer flex items-center justify-center"
                >
                  <img 
                    src="/assets/home/VectorHeader.svg" 
                    alt="User Menu" 
                    className="w-full h-full brightness-0"
                  />
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
                className="h-[20px] md:h-[18px] sm:h-[16px] w-[20px] md:w-[18px] sm:w-[16px] relative shrink-0 cursor-pointer flex items-center justify-center"
              >
                <ExitIcon size={20} className="brightness-0" />
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 bg-[#62b3e8]/30 backdrop-blur-sm z-[200] flex items-start justify-center pt-16 md:pt-20 px-4"
          onClick={() => setShowSearchModal(false)}
          style={{ touchAction: 'none' }}
        >
          <div 
            ref={searchModalRef}
            className="w-full max-w-2xl animate-in fade-in slide-in-from-top-2 duration-200 relative z-[201]"
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
                  className="w-full h-12 md:h-14 pl-12 md:pl-14 pr-4 bg-[#62b3e8]/80 backdrop-blur-md border-2 border-white/90 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white text-base md:text-lg placeholder:text-white/70 text-white shadow-lg pointer-events-auto relative z-[104] touch-manipulation"
                  autoFocus
                  autoComplete="off"
                  style={{ WebkitAppearance: 'none', WebkitTapHighlightColor: 'transparent' }}
                />
                {/* Search Icon inside input */}
                <div className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 pointer-events-none z-[105]">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Home Page Footer Component
 * Custom footer for home page with background image
 */
export function HomePageFooter() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="absolute h-[620px] lg:h-[620px] md:h-[600px] sm:h-[500px] left-0 top-[5550px] lg:top-[5550px] md:top-[5000px] sm:top-[4000px] w-full relative overflow-hidden">
      {/* Footer Background Image - daniel sinoca */}
      <div className="absolute inset-0 z-0">
        <img 
          alt="Footer Background" 
          className="absolute inset-0 w-full h-full object-cover" 
          src={imgDanielSinocaAancLsb0SU0Unsplash1}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
      </div>
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 z-[1]" />
      <div className="absolute h-[400px] lg:h-[400px] md:h-[400px] sm:h-[350px] left-[calc(50%+0.5px)] top-[200px] lg:top-[200px] md:top-[180px] sm:top-[120px] translate-x-[-50%] w-[1080px] lg:w-[1080px] md:w-[90%] sm:w-[95%] relative z-10">
        <div className="absolute content-stretch flex gap-[230px] lg:gap-[230px] md:gap-[120px] sm:gap-[40px] items-start justify-start left-[calc(50%-16px)] top-0 translate-x-[-50%] flex-col md:flex-row sm:flex-col">
          {/* Column 1: Logo + Description */}
          <div className="flex flex-col h-[280px] lg:h-[280px] md:h-[280px] sm:h-auto relative shrink-0 w-[300px] lg:w-[300px] md:w-[45%] sm:w-full gap-[30px] lg:gap-[30px] md:gap-[24px] sm:gap-[20px]">
            <div className="content-stretch flex h-[14px] items-center left-0 top-0 w-[300px] lg:w-[300px] md:w-full sm:w-full">
              <div className="h-[30px] lg:h-[30px] md:h-[30px] sm:h-[26px] relative shrink-0 w-[100px] lg:w-[100px] md:w-[95px] sm:w-[80px]">
                <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgBorborAguaLogoColorB2024Colored1} />
              </div>
            </div>
            <div className="content-stretch flex flex-row flex-wrap items-start left-0 w-[300px] lg:w-[300px] md:w-full sm:w-full">
              <div className="flex font-['Inter',sans-serif] font-bold justify-center leading-[24px] lg:leading-[24px] md:leading-[24px] sm:leading-[22px] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white w-full">
                <p className="leading-[24px] lg:leading-[24px] md:leading-[24px] sm:leading-[22px]">
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

          {/* Column 2-4: Contact, Policies, Site Map */}
          <div className="content-stretch flex gap-[185px] lg:gap-[185px] md:gap-[80px] sm:gap-[40px] items-start relative shrink-0 flex-col md:flex-row sm:flex-col">
            {/* Column 2: Contact */}
            <div className="content-stretch flex flex-col gap-[20px] lg:gap-[20px] md:gap-[20px] sm:gap-[16px] items-start relative shrink-0 w-[215px] lg:w-[215px] md:w-[45%] sm:w-full">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[21px] lg:text-[21px] md:text-[20px] sm:text-[18px] text-white tracking-[1.6px] lg:tracking-[1.6px] md:tracking-[1.5px] sm:tracking-[1.2px] uppercase w-full">
                  <p className="leading-[18px] lg:leading-[18px] md:leading-[18px] sm:leading-[16px] whitespace-pre-wrap">{t('home.footer.contact.title')}</p>
                </div>
              </div>
              <div className="content-stretch flex flex-row flex-wrap gap-[14px] lg:gap-[14px] md:gap-[12px] sm:gap-[10px] items-start relative shrink-0 w-[215px] lg:w-[215px] md:w-full sm:w-full">
                <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap">
                  <p className="font-['Inter',sans-serif] font-bold mb-0">
                    <span className="leading-[24px]">{t('home.footer.contact.office')} </span>
                    <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[24px] underline" href="tel:0037433000401">
                      <span className="[text-decoration-skip-ink:none] decoration-solid leading-[24px]">+374 33 000401</span>
                    </a>
                  </p>
                </div>
                <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap">
                  <p className="font-['Inter',sans-serif] font-bold">
                    <span className="leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px]">{t('home.footer.contact.delivery')} </span>
                    <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px] underline" href="tel:0037441012004">
                      <span className="[text-decoration-skip-ink:none] decoration-solid leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px]">+374 41 012004</span>
                    </a>
                  </p>
                </div>
                <div className="flex font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap">
                  <p className="font-['Inter',sans-serif] font-bold">
                    <span className="leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px]">{t('home.footer.contact.email')} </span>
                    <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px] underline" href="mailto:borboraqua.am@gmail.com">
                      <span className="[text-decoration-skip-ink:none] decoration-solid leading-[22px] lg:leading-[22px] md:leading-[24px] sm:leading-[24px]">info@borboraqua.am</span>
                    </a>
                  </p>
                </div>
                <div className="flex font-['Inter',sans-serif] font-bold justify-center leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap">
                  <p className="mb-0">{t('home.footer.contact.location')} {t('home.footer.contact.locationLine1')}</p>
                </div>
                <div className="flex font-['Inter',sans-serif] font-bold justify-center leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap">
                  <p className="mb-0">{t('home.footer.contact.locationLine2')}</p>
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
                  className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px]">{t('home.footer.policies.privacyPolicy')}</p>
                </div>
                <div
                  onClick={() => router.push('/terms')}
                  className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px]">{t('home.footer.policies.termsConditions')}</p>
                </div>
                <div
                  onClick={() => router.push('/delivery-terms')}
                  className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px]">{t('home.footer.policies.deliveryTerms')}</p>
                </div>
                <div
                  onClick={() => router.push('/refund-policy')}
                  className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px]">{t('home.footer.policies.refundPolicy')}</p>
                </div>
              </div>
            </div>

            {/* Column 4: Site Map */}
            <div className="content-stretch flex flex-col gap-[20px] lg:gap-[20px] md:gap-[20px] sm:gap-[16px] items-start relative shrink-0 w-[94px] lg:w-[94px] md:w-[45%] sm:w-full">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                <div className="flex flex-col font-['Montserrat',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[15px] lg:text-[15px] md:text-[15px] sm:text-[13px] text-white tracking-[1.3px] lg:tracking-[1.3px] md:tracking-[1.2px] sm:tracking-[1px] uppercase w-full">
                  <p className="leading-[18px] lg:leading-[18px] md:leading-[18px] sm:leading-[16px] whitespace-pre-wrap">{t('home.footer.siteMap.title')}</p>
                </div>
              </div>
              <div className="content-stretch flex flex-row flex-wrap gap-[16px] lg:gap-[16px] md:gap-[14px] sm:gap-[12px] items-start relative shrink-0 w-full">
                <div
                  onClick={() => router.push('/about')}
                  className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px]">{t('home.footer.siteMap.aboutUs')}</p>
                </div>
                <div
                  onClick={() => router.push('/contact')}
                  className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px]">{t('home.footer.siteMap.contact')}</p>
                </div>
                <div
                  onClick={() => router.push('/products')}
                  className="flex font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] lg:text-[16px] md:text-[16px] sm:text-[14px] text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="leading-[22px] lg:leading-[22px] md:leading-[22px] sm:leading-[20px]">{t('home.footer.siteMap.shop')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Icons */}
        <div className="absolute content-stretch flex gap-[14px] lg:gap-[14px] md:gap-[16px] sm:gap-[16px] h-[44px] lg:h-[44px] md:h-[48px] sm:h-[48px] items-center left-[17px] lg:left-[17px] md:left-[19px] sm:left-[19px] pt-[7px] lg:pt-[7px] md:pt-[8px] sm:pt-[8px] top-[280px] lg:top-[280px] md:top-[312px] sm:top-[312px] w-[300px] lg:w-[300px] md:w-[336px] sm:w-[336px]">
          <div className="border border-solid border-white content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[36px] lg:size-[36px] md:size-[40px] sm:size-[40px]">
            <div className="relative shrink-0 size-[18px] lg:size-[18px] md:size-[20px] sm:size-[20px]">
              <img alt="Social" className="block max-w-none size-full" src={imgSvg} />
            </div>
          </div>
          <div className="border border-solid border-white content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[36px] lg:size-[36px] md:size-[40px] sm:size-[40px]">
            <div className="relative shrink-0 size-[18px] lg:size-[18px] md:size-[20px] sm:size-[20px]">
              <img alt="Social" className="block max-w-none size-full" src={imgSvg1} />
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
            <img alt="Social" className="block max-w-none size-full" src={imgLink} />
          </div>
        </div>

        {/* Copyright & Payment Icons */}
        <div className="absolute content-stretch flex items-center justify-between left-0 right-0 px-[20px] lg:px-[20px] md:px-[16px] sm:px-[12px] pt-[36px] lg:pt-[36px] md:pt-[32px] sm:pt-[24px] top-[350px] lg:top-[350px] md:top-[320px] sm:top-[280px] w-full flex-col sm:flex-col md:flex-row">
          <div className="relative shrink-0">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center relative">
              <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] lg:text-[12px] md:text-[11px] sm:text-[10px] text-white whitespace-nowrap">
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
  );
}

/**
 * Home Page Button Components
 * Reusable button components for home page
 */
interface HomePageButtonProps {
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  className?: string;
}

export function HomePageButton({ onClick, variant = 'primary', children, className = '' }: HomePageButtonProps) {
  const baseClasses = variant === 'primary'
    ? "bg-[#1ac0fd] content-stretch flex flex-col h-[54px] lg:h-[54px] md:h-[52px] sm:h-[44px] items-center justify-center pl-[54px] pr-[52px] lg:pl-[54px] lg:pr-[52px] md:pl-[48px] md:pr-[46px] sm:pl-[32px] sm:pr-[30px] py-[14px] lg:py-[14px] md:py-[12px] sm:py-[10px] relative rounded-[9999px] shrink-0 w-[165px] lg:w-[165px] md:w-[160px] sm:w-[140px] cursor-pointer hover:bg-[#00b8e6] transition-colors"
    : "bg-[rgba(0,0,0,0)] content-stretch flex flex-col h-[54px] lg:h-[54px] md:h-[52px] sm:h-[44px] items-center justify-center px-[36px] lg:px-[36px] md:px-[32px] sm:px-[24px] py-[14px] lg:py-[14px] md:py-[12px] sm:py-[10px] relative rounded-[9999px] shrink-0 cursor-pointer hover:bg-white/10 transition-colors";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${className}`}
    >
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-white whitespace-nowrap">
        <p className="leading-[22px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px]">{children}</p>
      </div>
    </div>
  );
}

/**
 * Hero Section Buttons Container
 * Container for hero section buttons
 */
interface HeroButtonsProps {
  shopNowOnClick?: () => void;
  learnMoreOnClick?: () => void;
}

export function HeroButtons({ shopNowOnClick, learnMoreOnClick }: HeroButtonsProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="content-center flex flex-wrap gap-[0px_14px] lg:gap-[0px_14px] md:gap-[0px_12px] sm:gap-[0px_8px] h-[68px] lg:h-[68px] md:h-[64px] sm:h-[56px] items-center justify-center pt-[14px] lg:pt-[14px] md:pt-[12px] sm:pt-[8px] relative shrink-0 w-full">
      <HomePageButton
        variant="primary"
        onClick={shopNowOnClick || (() => router.push('/products'))}
      >
        {t('home.hero.shopNow')}
      </HomePageButton>
      <HomePageButton
        variant="secondary"
        onClick={learnMoreOnClick || (() => router.push('/about'))}
      >
        {t('home.hero.learnMore')}
      </HomePageButton>
    </div>
  );
}

