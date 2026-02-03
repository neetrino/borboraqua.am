'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredLanguage, setStoredLanguage, LANGUAGES, type LanguageCode } from '../../../lib/language';
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
// Mobile footer/background wave PNG from Figma, saved locally in public/assets/home
const imgDanielSinocaAancLsb0SU0Unsplash3 = "/assets/home/imgDanielWave.png";

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
  return (
    <div className="xl:hidden absolute content-stretch flex items-center justify-between left-[17px] right-[17px] top-[35px] z-50">
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
      <div className="h-[31px] relative shrink-0 w-[101px] cursor-pointer ml-4 md:ml-6" onClick={() => router.push('/')}>
        <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBorborAguaLogoColorB2024Colored1} />
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

interface MobileFooterProps {
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
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

export function MobileFooter({ router, t }: MobileFooterProps) {
  return (
    <div className="xl:hidden relative w-full mt-auto overflow-visible">
      {/* Mobile Footer Background Images - Daniel Sinoca */}
      <div className="absolute h-[490px] left-[-0.6px] right-0 top-0 w-full pointer-events-none">
        <div className="relative w-full h-full">
          <img
            alt=""
            className="absolute left-1/2 -translate-x-1/2 w-[120%] h-full object-cover"
            src={imgDanielSinocaAancLsb0SU0Unsplash3}
          />
        </div>
      </div>
      <div className="absolute flex h-[873px] items-center justify-center left-0 right-0 top-[480px] w-full pointer-events-none">
        <div className="-scale-y-100 flex-none">
          <div className="blur-[2px] h-[873px] relative w-[2078px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img alt="" className="absolute h-[158.63%] left-0 max-w-none top-[-58.62%] w-full" src={imgDanielSinocaAancLsb0SU0Unsplash3} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="relative z-10 content-stretch flex flex-col gap-[30px] items-start justify-center left-0 w-[339px] max-w-[calc(1200%-70px)] mx-auto pb-[0px] pt-48 ">
        <div className="h-[312px] relative shrink-0 w-full">
          <div className="absolute content-stretch flex h-[34px] items-center left-0 top-0 w-[336px]">
            <div className="h-[34px] relative shrink-0 w-[112px]">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBorborAguaLogoColorB2024Colored1} />
            </div>
          </div>
          <div className="absolute content-stretch flex flex-col items-start left-0 top-[68px] w-[336px]">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-full">
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
                <p className="mb-0">Location: {t('home.footer.contact.locationLine1')}</p>
                <p className="mb-0">{t('home.footer.contact.locationLine2')}</p>
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
                <p className="leading-[24px] whitespace-pre-wrap">{t('home.footer.policies.privacyPolicy')}</p>
              </div>
            </button>
            <button onClick={() => router.push('/terms')} className="text-left">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                <p className="leading-[24px] whitespace-pre-wrap">{t('home.footer.policies.termsConditions')}</p>
              </div>
            </button>
            <button onClick={() => router.push('/delivery-terms')} className="text-left">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                <p className="leading-[24px] whitespace-pre-wrap">{t('home.footer.policies.deliveryTerms')}</p>
              </div>
            </button>
            <button onClick={() => router.push('/refund-policy')} className="text-left">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-full">
                <p className="leading-[24px] whitespace-pre-wrap">{t('home.footer.policies.refundPolicy')}</p>
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
                <p className="leading-[24px] whitespace-pre-wrap">{t('home.footer.siteMap.aboutUs')}</p>
              </div>
            </button>
            <button onClick={() => router.push('/contact')} className="text-left w-full">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                <p className="leading-[24px] whitespace-pre-wrap">{t('home.footer.siteMap.contact')}</p>
              </div>
            </button>
            <button onClick={() => router.push('/products')} className="text-left w-full">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white">
                <p className="leading-[24px] whitespace-pre-wrap">{t('home.footer.siteMap.shop')}</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Footer Copyright */}
      <div className="relative z-10 border-[#e2e8f0] border-solid border-t content-stretch flex flex-col gap-[16px] items-center justify-center  w-full max-w-[386px] mx-auto top-[-160px]">
        <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap mt-[16px]">
          <p className="leading-[16px]">{t('home.footer.copyright')}</p>
        </div>
        <div className="relative shrink-0">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[13px] items-center justify-end relative">
            <div className="h-[25.998px] relative shrink-0 w-[35.198px] left-[-50px]">
              <img alt="" className="block max-w-none size-full" src={imgGroup2122} />
            </div>
            <div className="h-[25.209px] relative shrink-0 w-[35.946px] left-[-30px]">
              <img alt="" className="block max-w-none size-full" src={imgGroup2121} />
            </div>
            <div className="h-[25.209px] relative shrink-0 w-[35.706px] left-[-15px]">
              <img alt="" className="block max-w-none size-full" src={imgGroup2124} />
            </div>
            <div className="h-[35px] relative shrink-0 w-[55.735px] left-[15px]">
              <img alt="" className="block max-w-none size-full" src={imgGroup2123} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Bottom Navigation Images
const imgEllipse2 = "/assets/home/imgEllipse2.svg";
const imgHomeVector = "/assets/home/Vector.svg";
const imgVector1 = "/assets/home/imgVector1.svg";
const imgGroup2148 = "/assets/home/imgGroup2148.svg";
const imgGroup2149 = "/assets/home/imgGroup2149.svg";

/**
 * Top Header Bar for all pages (except home page)
 * Contains search, logo, and hamburger menu with white background
 */
interface TopHeaderBarProps {
  router: ReturnType<typeof useRouter>;
  setShowSearchModal: (show: boolean) => void;
  setShowMobileMenu: (show: boolean) => void;
}

export function TopHeaderBar({
  router,
  setShowSearchModal,
  setShowMobileMenu,
}: TopHeaderBarProps) {
  return (
    <div className="xl:hidden fixed top-0 left-0 right-0 w-full z-50 bg-[rgba(255,255,255,0.32)] backdrop-blur-[15px] border-b border-black shadow-sm rounded-b-3xl overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center justify-between pl-4 pr-4 py-3 h-[73px] w-full">
        <div className="flex items-center gap-2">
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
        {/* Borbor Logo - Right aligned, touching border */}
        <div className="h-[31px] relative shrink-0 w-[101px] cursor-pointer" onClick={() => router.push('/')}>
          <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBorborAguaLogoColorB2024Colored1} />
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
    <div className="-translate-x-1/2 fixed xl:hidden left-1/2 bottom-0 w-full max-w-[430px] px-4 pb-5 z-50">
      <div className="relative bg-white/5 backdrop-blur-3xl h-[72px] rounded-[999px] shadow-[0_20px_55px_rgba(0,0,0,0.25)] border border-white/10 overflow-hidden">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex items-center justify-center left-1/2 top-1/2 w-[348px]">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-[252px]">
            {/* Home */}
            <button
              onClick={() => router.push('/')}
              className="group h-[56px] w-[56px] relative flex items-center justify-center transition-transform duration-200 hover:-translate-y-1 active:scale-95"
            >
              {activeIndex === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <img className="block max-w-none size-[56px] opacity-70" alt="" src={imgEllipse2} />
                </div>
              )}
              <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-250" />
              <img className="relative block max-w-none size-[19px]" alt="" src={imgHomeVector} />
            </button>
            {/* Shop */}
            <button
              onClick={() => router.push('/products')}
              className="group block cursor-pointer h-[56px] w-[56px] relative flex items-center justify-center opacity-90 hover:opacity-100 transition-transform duration-200 hover:scale-110 hover:-translate-y-1 active:scale-95"
            >
              {activeIndex === 1 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <img className="block max-w-none size-[56px] opacity-70" alt="" src={imgEllipse2} />
                </div>
              )}
              <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-250" />
              <img className="relative block max-w-none size-[20px]" alt="" src={imgVector1} />
            </button>
            {/* Cart */}
            <button
              onClick={() => router.push('/cart')}
              className="group block cursor-pointer h-[56px] w-[56px] relative flex items-center justify-center opacity-90 hover:opacity-100 transition-transform duration-200 hover:scale-110 hover:-translate-y-1 active:scale-95"
            >
              {activeIndex === 2 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <img className="block max-w-none size-[56px] opacity-70" alt="" src={imgEllipse2} />
                </div>
              )}
              <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-250" />
              <img className="relative block max-w-none h-[22.312px] w-[25px]" alt="" src={imgGroup2148} />
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

