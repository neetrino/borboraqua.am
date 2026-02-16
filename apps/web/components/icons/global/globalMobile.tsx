'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredLanguage, setStoredLanguage, LANGUAGES, type LanguageCode } from '../../../lib/language';
import { type CurrencyCode, getStoredCurrency, setStoredCurrency } from '../../../lib/currency';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useTranslation } from '../../../lib/i18n-client';
import { apiClient } from '../../../lib/api-client';

// Local image paths
const imgBorborAguaLogoColorB2024Colored1 = "/assets/home/imgBorborAguaLogoColorB2024Colored1.png";
const imgVector2 = "/assets/home/imgVector2.svg";
const imgVector3 = "/assets/home/imgVector3.svg";
const imgIcon2 = "/assets/home/imgIcon2.svg";
const imgGroup2122 = "/assets/home/imgGroup2122.svg";
const imgGroup2121 = "/assets/home/imgGroup2121.svg";
const imgGroup2124 = "/assets/home/imgGroup2124.svg";
const imgGroup2123 = "/assets/home/imgGroup2123.svg";

interface MobileHeaderProps {
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
  setShowSearchModal: (show: boolean) => void;
  setShowMobileMenu: (show: boolean) => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export function MobileHeader({
  router,
  t,
  setShowSearchModal,
  setShowMobileMenu,
  isLoggedIn,
  isAdmin,
}: MobileHeaderProps) {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [currency, setCurrency] = useState<CurrencyCode>('AMD');
  const [showLangCurrencyMenu, setShowLangCurrencyMenu] = useState(false);
  const langCurrencyMenuRef = useRef<HTMLDivElement | null>(null);
  const imgLanguageIcon = "/assets/home/Vector.svg";

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

  // Get language code for display (EN, HY, RU)
  const getLanguageDisplayCode = (code: LanguageCode): string => {
    const codes: Record<LanguageCode, string> = {
      en: 'EN',
      hy: 'HY',
      ru: 'RU',
    };
    return codes[code] || 'EN';
  };

  return (
    <div 
      className="xl:hidden absolute content-stretch flex items-center justify-between left-[17px] right-[17px] top-[35px] z-50"
      style={{
        background: 'linear-gradient(135deg, rgba(55, 105, 205, 0.3), rgba(75, 135, 225, 0.3))',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRadius: '9999px',
        padding: '8px 12px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
      }}
    >
      <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
        {/* Mobile Menu Button (Hamburger) */}
        <button
          onClick={() => setShowMobileMenu(true)}
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
    </div>
  );
}

interface MobileMenuProps {
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  handleLogout: () => void;
  showLanguageMenu: boolean;
  setShowLanguageMenu: (show: boolean) => void;
}

export function MobileMenu({
  router,
  t,
  showMobileMenu,
  setShowMobileMenu,
  isLoggedIn,
  isAdmin,
  handleLogout,
  showLanguageMenu,
  setShowLanguageMenu,
}: MobileMenuProps) {
  if (!showMobileMenu) return null;

  return (
    <div className="xl:hidden fixed inset-0 bg-gradient-to-b from-[#62b3e8] to-[rgba(11, 55, 168, 0.75)] backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setShowMobileMenu(false)}>
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
  );
}

interface MobileSearchProps {
  t: (key: string) => string;
  showSearchModal: boolean;
  setShowSearchModal: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
}

export function MobileSearch({
  t,
  showSearchModal,
  setShowSearchModal,
  searchQuery,
  setSearchQuery,
  handleSearch,
}: MobileSearchProps) {
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle click outside for search modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchModalRef.current && !searchModalRef.current.contains(event.target as Node)) {
        setShowSearchModal(false);
      }
    };

    if (showSearchModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchModal, setShowSearchModal]);

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
  }, [showSearchModal, setShowSearchModal]);

  if (!showSearchModal) return null;

  return (
    <div 
      className="xl:hidden fixed inset-0 bg-[#62b3e8]/30 backdrop-blur-sm z-[100] flex items-start justify-center pt-16 px-4"
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
  );
}

export interface ProfileMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ProfileMenuDrawerProps {
  tabs: ProfileMenuItem[];
  activeTab: string;
  onSelect: (_tabId: string) => void;
}

/**
 * Mobile drawer for navigating profile dashboard tabs.
 * Moved to globalMobile.tsx for use across all pages.
 */
export function ProfileMenuDrawer({ tabs, activeTab, onSelect }: ProfileMenuDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      console.info('[ProfileMenuDrawer] Locking body scroll');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleSelect = (tabId: string) => {
    console.info('[ProfileMenuDrawer] Selecting tab', { tabId });
    onSelect(tabId);
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => {
          console.info('[ProfileMenuDrawer] Opening drawer');
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
            console.info('[ProfileMenuDrawer] Closing drawer from backdrop');
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
              <p className="text-lg font-semibold text-gray-900">Profile Navigation</p>
              <button
                type="button"
                onClick={() => {
                  console.info('[ProfileMenuDrawer] Closing drawer from button');
                  setOpen(false);
                }}
                className="h-10 w-10 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                aria-label="Close profile menu"
              >
                <svg className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleSelect(tab.id)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium ${
                    activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={activeTab === tab.id ? 'text-white' : 'text-gray-500'}>{tab.icon}</span>
                    {tab.label}
                  </span>
                  <svg
                    className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile Bottom Navigation Images
const imgEllipse41 = "/assets/home/imgEllipse41.svg";
const imgHomeVector = "/assets/home/Vector1.svg";
const imgVector1 = "/assets/home/1254.svg";
const imgGroup2148 = "/assets/home/Cart.svg";
const imgGroup2149 = "/assets/home/imgGroup2149.svg";

/** Pathname to header page title translation key (home.navigation.* or common.navigation.*) */
function getPageTitleKey(pathname: string): string {
  if (pathname === '/') return 'home.navigation.home';
  if (pathname.startsWith('/products')) return 'home.navigation.shop';
  if (pathname.startsWith('/about')) return 'home.navigation.aboutUs';
  if (pathname.startsWith('/blog')) return 'home.navigation.blog';
  if (pathname.startsWith('/contact')) return 'home.navigation.contactUs';
  if (pathname.startsWith('/profile')) return 'common.navigation.profile';
  if (pathname.startsWith('/admin')) return 'common.navigation.admin';
  return 'home.navigation.home';
}

/**
 * Top Header Bar for all pages (except home page)
 * Contains search, current page title, and hamburger menu with white background
 */
interface TopHeaderBarProps {
  router: ReturnType<typeof useRouter>;
  pathname: string;
  t: (key: string) => string;
  setShowSearchModal: (show: boolean) => void;
  setShowMobileMenu: (show: boolean) => void;
}

export function TopHeaderBar({
  router,
  pathname,
  t,
  setShowSearchModal,
  setShowMobileMenu,
}: TopHeaderBarProps) {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [currency, setCurrency] = useState<CurrencyCode>('AMD');
  const [showLangCurrencyMenu, setShowLangCurrencyMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const langCurrencyMenuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const imgLanguageIcon = "/assets/home/Vector.svg";

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

  // Calculate dropdown position when menu opens
  useEffect(() => {
    if (showLangCurrencyMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px = mt-2 (margin-top)
        right: window.innerWidth - rect.right,
      });
    }
  }, [showLangCurrencyMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside both button and dropdown menu (which is in Portal)
      const isClickOutsideButton = langCurrencyMenuRef.current && !langCurrencyMenuRef.current.contains(target);
      const isClickOutsideDropdown = !target.closest('.language-currency-dropdown');
      
      if (isClickOutsideButton && isClickOutsideDropdown) {
        setShowLangCurrencyMenu(false);
      }
    };

    if (showLangCurrencyMenu) {
      // Use setTimeout to avoid immediate closure when opening
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangCurrencyMenu]);

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

  // Get language code for display (EN, HY, RU)
  const getLanguageDisplayCode = (code: LanguageCode): string => {
    const codes: Record<LanguageCode, string> = {
      en: 'EN',
      hy: 'HY',
      ru: 'RU',
    };
    return codes[code] || 'EN';
  };

  return (
    <div 
      className="xl:hidden fixed top-0 left-0 right-0 w-full z-[100] border-b shadow-sm overflow-x-hidden overflow-y-visible" 
      style={{ 
        paddingTop: 'env(safe-area-inset-top, 0px)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.3), rgba(55, 105, 205, 0.08), rgba(75, 135, 225, 0.08))',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
      }}
    >
      <div className="relative flex items-center justify-between pl-4 pr-4 py-3 h-[73px] w-full">
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="bg-transparent border border-black cursor-pointer flex items-center justify-center p-3 rounded-full w-[49px] h-[49px] transition-all duration-300 hover:bg-black hover:border-black hover:scale-110 active:scale-95"
          >
            <div className="flex items-center justify-center">
              <div className="-scale-y-100 flex-none rotate-180">
                <div className="h-[12px] relative w-[18px]">
                  <img className="block max-w-none size-full brightness-0" alt="" src={imgVector3} />
                </div>
              </div>
            </div>
          </button>
          {/* Search Button */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="bg-transparent border border-black cursor-pointer flex items-center justify-center p-3 rounded-full transition-all duration-300 hover:bg-white/10 hover:border-white/80 hover:scale-110 active:scale-95"
          >
            <div className="flex items-center justify-center">
              <div className="-scale-y-100 flex-none rotate-180">
                <div className="relative size-[20px]">
                  <img className="block max-w-none size-full brightness-0" alt="" src={imgVector2} />
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Current page title - centered */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-base font-bold text-gray-900 uppercase tracking-wide">
            {t(getPageTitleKey(pathname))}
          </span>
        </div>

        {/* Language & Currency Selector */}
        <div className="relative z-[200] flex-shrink-0" ref={langCurrencyMenuRef}>
          <button
            ref={buttonRef}
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

          {/* Dropdown Menu - Using Portal to escape overflow-hidden */}
          {showLangCurrencyMenu && typeof window !== 'undefined' && createPortal(
            <div 
              className="language-currency-dropdown fixed w-48 bg-white rounded-lg shadow-lg z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
                pointerEvents: 'auto',
              }}
            >
              {/* Language Section */}
              <div className="px-3 py-2 border-b border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Language</div>
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <button
                    key={code}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLanguageChange(code as LanguageCode);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-all duration-150 cursor-pointer ${
                      language === code
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    style={{ pointerEvents: 'auto' }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCurrencyChange(code);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors cursor-pointer ${
                      currency === code
                        ? 'bg-gray-100 text-gray-900 font-semibold cursor-default'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Bottom Navigation Component
 * Glassmorphism navigation bar with Home, Shop, Cart, Profile icons
 * Moved from home page to be used across all pages
 */
export function MobileBottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const [cartCount, setCartCount] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const navRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const iconRefs = useRef<(HTMLImageElement | null)[]>([]);

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

  // Smooth scroll tracking with requestAnimationFrame for 60fps
  // Apple-style color transition: white -> light blue gradient on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;
    const DEBUG = false; // Set to true for scroll progress debugging

    const updateScrollProgress = () => {
      // Background is always blue gradient, icons are always white
      // No scroll-based transitions needed
      if (navRef.current) {
        // Always use blue gradient colors (fixed)
        const bgOpacity = 0.3; // Fixed opacity for blue gradient
        const borderOpacity = 0.5; // Fixed border opacity
        
        // Blue gradient colors (Apple-style)
        const r1 = 55;  // Light blue
        const g1 = 105;
        const b1 = 205;
        
        const r2 = 75;  // Lighter blue
        const g2 = 135;
        const b2 = 225;
        
        navRef.current.style.background = `linear-gradient(135deg, 
          rgba(${r1}, ${g1}, ${b1}, ${bgOpacity}),
          rgba(${r2}, ${g2}, ${b2}, ${bgOpacity})
        )`;
        navRef.current.style.borderColor = `rgba(255, 255, 255, ${borderOpacity})`;
      }
      
      // Update icon colors - always white icons
      iconRefs.current.forEach((iconRef) => {
        if (iconRef) {
          // Icons should always be white (invert = 1)
          iconRef.style.filter = `brightness(0) invert(1)`;
        }
      });
      
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    // Initial update
    updateScrollProgress();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, []);

  // Determine active navigation index based on current pathname
  const getActiveIndex = () => {
    if (pathname === '/') return 0;
    if (pathname.startsWith('/products')) return 1;
    if (pathname.startsWith('/cart')) return 2;
    if (pathname.startsWith('/profile')) return 3;
    return null;
  };

  const activeIndex = getActiveIndex();

  return (
    <div 
      className="-translate-x-1/2 fixed xl:hidden left-1/2 bottom-0 w-full max-w-[85%] sm:max-w-[320px] px-2 z-50 overflow-x-hidden"
      style={{ 
        paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
      }}
    >
      <div 
        ref={navRef}
        className="relative h-[72px] rounded-[999px] border overflow-hidden w-full"
        style={{
          background: 'linear-gradient(135deg, rgba(55, 105, 205, 0.3), rgba(75, 135, 225, 0.3))',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderColor: 'rgba(255, 255, 255, 0.5)',
          willChange: 'background, border-color',
          transition: 'none', // Disable CSS transitions, we use RAF for smooth 60fps
          boxShadow: 'none', // Remove any box shadow
        }}
      >
        <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex items-center justify-center left-1/2 top-1/2 w-full max-w-[320px] sm:max-w-[340px] px-1">
          <div className="content-stretch flex items-center justify-center gap-7 sm:gap-9 md:gap-11 relative shrink-0 w-full">
            {/* Home */}
            <button
              onClick={() => router.push('/')}
              className="group h-[56px] w-[56px] relative flex items-center justify-center transition-transform duration-200 hover:-translate-y-1 active:scale-95"
            >
              {activeIndex === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <img className="block max-w-none size-[48px] opacity-70" alt="" src={imgEllipse41} />
                </div>
              )}
              <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-250" />
              <img 
                ref={(el) => { iconRefs.current[0] = el; }}
                className="relative block max-w-none size-[19px]" 
                alt="" 
                src={imgHomeVector}
                style={{ filter: 'brightness(0) invert(1)', willChange: 'filter' }}
              />
            </button>
            {/* Shop */}
            <button
              onClick={() => router.push('/products')}
              className="group block cursor-pointer h-[56px] w-[56px] relative flex items-center justify-center opacity-90 hover:opacity-100 transition-transform duration-200 hover:scale-110 hover:-translate-y-1 active:scale-95"
            >
              {activeIndex === 1 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <img className="block max-w-none size-[48px] opacity-70" alt="" src={imgEllipse41} />
                </div>
              )}
              <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-250" />
              <img 
                ref={(el) => { iconRefs.current[1] = el; }}
                className="relative block max-w-none size-[28px]" 
                alt="" 
                src={imgVector1}
                style={{ filter: 'brightness(0) invert(1)', willChange: 'filter' }}
              />
            </button>
            {/* Cart */}
            <button
              onClick={() => router.push('/cart')}
              className="group block cursor-pointer h-[56px] w-[56px] relative flex items-center justify-center opacity-90 hover:opacity-100 transition-transform duration-200 hover:scale-110 hover:-translate-y-1 active:scale-95"
            >
              {activeIndex === 2 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <img className="block max-w-none size-[48px] opacity-70" alt="" src={imgEllipse41} />
                </div>
              )}
              <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-250" />
              <img 
                ref={(el) => { iconRefs.current[2] = el; }}
                className="relative block max-w-none h-[22.312px] w-[25px]" 
                alt="" 
                src={imgGroup2148}
                style={{ filter: 'brightness(0) invert(1)', willChange: 'filter' }}
              />
              {/* Cart Count Badge */}
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#00d1ff] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1.5 flex items-center justify-center border-2 border-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
            {/* Profile */}
            <button
              onClick={() => router.push('/profile')}
              className="group block cursor-pointer h-[56px] w-[56px] relative flex items-center justify-center opacity-90 hover:opacity-100 transition-transform duration-200 hover:scale-110 hover:-translate-y-1 active:scale-95"
            >
              {activeIndex === 3 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <img className="block max-w-none size-[48px] opacity-70" alt="" src={imgEllipse41} />
                </div>
              )}
              <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-250" />
              <img 
                ref={(el) => { iconRefs.current[3] = el; }}
                className="relative block max-w-none h-[22px] w-[18.526px]" 
                alt="" 
                src={imgGroup2149}
                style={{ filter: 'brightness(0) invert(1)', willChange: 'filter' }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable button component for product page, cart, and checkout
 * Matches the add to cart button styling
 * Moved to globalMobile.tsx for use across all pages.
 */
interface ProductPageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'icon' | 'cancel' | 'outline';
}

export function ProductPageButton({ 
  children, 
  variant = 'primary',
  className = '',
  ...props 
}: ProductPageButtonProps) {
  const baseStyles = 'transition-colors font-bold';
  
  const variantStyles = {
    primary: 'bg-[#00d1ff] text-white rounded-[34px] disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#00b8e6] px-6',
    secondary: 'bg-[#00d1ff] text-white rounded-[34px] disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#00b8e6] px-6',
    icon: 'bg-[#00d1ff] text-white rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#00b8e6] flex items-center justify-center',
    cancel: 'bg-[#00d1ff] text-white rounded-[34px] disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#00b8e6] h-[48px] px-6',
    outline: 'bg-transparent border-2 border-[#00d1ff] text-[#00d1ff] rounded-[34px] disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed hover:bg-[#00d1ff] hover:text-white px-6',
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

