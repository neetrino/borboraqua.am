'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Header, Footer } from './icons/global/global';
import { MobileHeader, MobileMenu, MobileSearch, MobileBottomNavigation, TopHeaderBar } from './icons/global/globalMobile';
import { Breadcrumb } from './Breadcrumb';
import { useAuth } from '../lib/auth/AuthContext';
import { useTranslation } from '../lib/i18n-client';
import { getStoredLanguage, setStoredLanguage, LANGUAGES, type LanguageCode } from '../lib/language';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [globalModalOpen, setGlobalModalOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
        setShowSearchModal(false);
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
        setShowSearchModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSearchModal]);

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
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
      />
      
      {/* Spacer section at the top - increases page height */}
      <div className="hidden xl:block w-full bg-transparent h-[80px] md:h-[70px] sm:h-[60px] flex-shrink-0 relative z-10" />
      {/* Desktop Header - Only visible on desktop and hidden when any global popup is open */}
      {!showSearchModal && !globalModalOpen && (
        <div className="hidden xl:block">
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
          className="hidden xl:flex fixed inset-0 bg-[#62b3e8]/30 backdrop-blur-sm z-[100] items-start justify-center pt-16 px-4"
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
                  className="w-full h-14 pl-14 pr-4 bg-[#60b3e8]/80 backdrop-blur-md border-2 border-white/90 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white text-lg placeholder:text-white/70 text-white shadow-lg"
                  autoFocus
                  autoComplete="off"
                />
                {/* Search Icon inside input */}
                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
