'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Header, Footer } from './icons/global/global';
import { MobileHeader, MobileMenu, MobileSearch, MobileBottomNavigation, TopHeaderBar } from './icons/global/globalMobile';
import { Breadcrumb } from './Breadcrumb';
import { useAuth } from '../lib/auth/AuthContext';
import { useTranslation } from '../lib/i18n-client';
import { getStoredLanguage, setStoredLanguage, LANGUAGES, type LanguageCode } from '../lib/language';
import { formatPrice as formatPriceCurrency, getStoredCurrency } from '../lib/currency';
import { useInstantSearch } from '../hooks/useInstantSearch';
import { SearchDropdown } from './SearchDropdown';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const isHomePage = pathname === '/';
  const isProductsPage = pathname.startsWith('/products');
  const isAdminPage = pathname.startsWith('/admin');
  const isProfilePage = pathname.startsWith('/profile');

  // State for header navigation
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [globalModalOpen, setGlobalModalOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    selectedIndex: searchSelectedIndex,
    handleKeyDown: handleSearchKeyDown,
    clearSearch,
  } = useInstantSearch({
    debounceMs: 200,
    minQueryLength: 1,
    maxResults: 5,
  });

  const closeSearchModal = () => {
    clearSearch();
    setShowSearchModal(false);
  };

  // Close language menu and user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchModalRef.current && !searchModalRef.current.contains(event.target as Node)) {
        closeSearchModal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen for global modal open/close events (e.g. checkout modals)
  useEffect(() => {
    const handleModalOpen = () => setGlobalModalOpen(true);
    const handleModalClose = () => setGlobalModalOpen(false);

    window.addEventListener('app:modal-open', handleModalOpen);
    window.addEventListener('app:modal-close', handleModalClose);

    return () => {
      window.removeEventListener('app:modal-open', handleModalOpen);
      window.removeEventListener('app:modal-close', handleModalClose);
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
        closeSearchModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSearchModal]);

  /**
   * Handle search submit (Enter): go to selected result or to catalog with query
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (searchSelectedIndex >= 0 && searchResults[searchSelectedIndex]) {
      const result = searchResults[searchSelectedIndex];
      router.push(`/products/${encodeURIComponent(result.slug)}`);
      closeSearchModal();
      return;
    }
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    router.push(params.toString() ? `/products?${params.toString()}` : '/products');
    closeSearchModal();
  };

  const handleSearchResultClick = (result: { slug: string }) => {
    router.push(`/products/${encodeURIComponent(result.slug)}`);
    closeSearchModal();
  };

  const formatPriceForSearch = (price: number) =>
    formatPriceCurrency(price, getStoredCurrency());

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

  if (isHomePage) {
    // Home page – թույլ ենք տալիս բնական scroll, որ footer-ը չկտրվի
    return (
      <>
        <main className="w-full home-page-wrapper">
          {children}
        </main>
        {/* Mobile Bottom Navigation - Only visible on mobile */}
        <MobileBottomNavigation />
      </>
    );
  }

  return (
    <div className={`relative flex min-h-screen flex-col pb-16 lg:pb-0 overflow-x-hidden overflow-y-hidden xl:overflow-y-visible ${isAdminPage || isProfilePage ? 'bg-white' : 'app-page-background'}`}>
      {/* Top Header Bar - Only visible on mobile, hidden when a popup is open */}
      {!showMobileMenu && !showSearchModal && !globalModalOpen && (
        <TopHeaderBar
          router={router}
          pathname={pathname}
          t={t}
          setShowSearchModal={setShowSearchModal}
          setShowMobileMenu={setShowMobileMenu}
        />
      )}

      {/* Mobile Menu - Only visible on mobile */}
      <MobileMenu
        router={router}
        t={t}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        handleLogout={handleLogout}
        showLanguageMenu={showLanguageMenu}
        setShowLanguageMenu={setShowLanguageMenu}
      />

      {/* Mobile Search - Only visible on mobile */}
      <MobileSearch
        t={t}
        showSearchModal={showSearchModal}
        setShowSearchModal={setShowSearchModal}
        closeSearchModal={closeSearchModal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        searchResults={searchResults}
        searchLoading={searchLoading}
        searchError={searchError}
        searchSelectedIndex={searchSelectedIndex}
        handleSearchKeyDown={handleSearchKeyDown}
        onSearchResultClick={handleSearchResultClick}
        formatPriceForSearch={formatPriceForSearch}
        onSearchSeeAll={(q) => {
          router.push(`/products?search=${encodeURIComponent(q)}`);
          closeSearchModal();
        }}
      />
      
      {/* Spacer section at the top - increases page height */}
      <div className="hidden xl:block w-full bg-transparent h-[80px] md:h-[70px] sm:h-[60px] flex-shrink-0 relative z-10" />
      {/* Desktop Header - Only visible on desktop and hidden when any global popup is open */}
      {!showSearchModal && !globalModalOpen && (
        <div className="hidden xl:block">
          <Header
            router={router}
            t={t}
            pathname={pathname}
            setShowSearchModal={setShowSearchModal}
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            setShowUserMenu={setShowUserMenu}
            showUserMenu={showUserMenu}
            handleLogout={handleLogout}
            userMenuRef={userMenuRef}
            isHomePage={false}
          />
        </div>
      )}
      {/* Breadcrumb - Only visible on desktop, integrated into content */}
      <div className="hidden xl:block pt-14">
        <Breadcrumb />
      </div>
      <main
        className={`flex-1 w-full relative z-10 ${
          isProductsPage 
            ? 'pt-20 xl:pt-4 pb-0 xl:pb-0'
            : 'pt-20 xl:pt-0 pb-0 xl:pb-0'
        }`}
      >
        {children}
      </main>
      {/* Desktop Footer - Only visible on desktop */}
      <div className="hidden xl:block">
        <Footer router={router} t={t} isHomePage={false} />
      </div>
      {/* Mobile Footer - Removed from all pages */}
      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <MobileBottomNavigation />

      {/* Desktop Search Modal - Only visible on desktop */}
      {showSearchModal && (
        <div 
          className="hidden xl:flex fixed inset-0 bg-[#62b3e8]/30 backdrop-blur-sm z-[200] items-start justify-center pt-16 px-4"
          onClick={() => closeSearchModal()}
        >
          <div
            ref={searchModalRef}
            className="w-full max-w-2xl animate-in fade-in slide-in-from-top-2 duration-200 relative z-[201]"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t('home.search.placeholder')}
                  className="w-full h-14 pl-14 pr-4 bg-white/10 backdrop-blur-xl border border-white/30 rounded-full focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 text-lg placeholder:text-white/80 text-white shadow-lg"
                  autoFocus
                  autoComplete="off"
                  aria-controls="search-results"
                  aria-expanded={showSearchModal && (searchResults.length > 0 || searchLoading)}
                  aria-autocomplete="list"
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </form>
            <SearchDropdown
              results={searchResults}
              loading={searchLoading}
              error={searchError}
              isOpen={showSearchModal}
              selectedIndex={searchSelectedIndex}
              query={searchQuery}
              onResultClick={handleSearchResultClick}
              onClose={closeSearchModal}
              onSeeAll={(q) => {
                router.push(`/products?search=${encodeURIComponent(q)}`);
                closeSearchModal();
              }}
              t={t}
              formatPrice={formatPriceForSearch}
            />
          </div>
        </div>
      )}
    </div>
  );
}
