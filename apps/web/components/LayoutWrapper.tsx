'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Header, Footer } from './icons/HomePageComponents';
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
    <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
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
      />
      <Breadcrumb />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer router={router} t={t} isHomePage={false} />
      <MobileBottomNav />
    </div>
  );
}

