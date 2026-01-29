'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Header, Footer } from './icons/global/global';
import { Breadcrumb } from './Breadcrumb';
import { MobileBottomNav } from './MobileBottomNav';
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
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close language menu and user menu when clicking outside
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

  if (isHomePage) {
    // Home page – թույլ ենք տալիս բնական scroll, որ footer-ը չկտրվի
    return (
      <main className="w-full home-page-wrapper">
        {children}
      </main>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col pb-16 lg:pb-0 bg-white">
      {/* Blue gradient section - 800px from top with smooth transition */}
      <div className="absolute top-0 left-0 right-0 h-[1100px] bg-[#8fd4ff] z-0" style={{ background: 'linear-gradient(to bottom, #8fd4ff 0%, #8fd4ff 50%, #9dd0ff 60%, #acd4ff 68%, #bbd8ff 75%, #cadeff 80%, #d9e6ff 83%, #e8eeff 86%, #f0f4ff 88%, #ffffff 96%)' }} />
      
      {/* Spacer section at the top - increases page height */}
      <div className="w-full bg-transparent h-[80px] md:h-[70px] sm:h-[60px] flex-shrink-0 relative z-10" />
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
      <Breadcrumb />
      <main className={`flex-1 w-full relative z-10 ${isProductsPage || isAdminPage || isProfilePage ? 'pt-4' : 'pt-[80px] md:pt-[70px] sm:pt-[60px]'}`}>
        {children}
      </main>
      <Footer router={router} t={t} isHomePage={false} />
      <MobileBottomNav />
    </div>
  );
}
