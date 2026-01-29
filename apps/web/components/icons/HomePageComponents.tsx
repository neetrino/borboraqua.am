'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredLanguage, LANGUAGES, type LanguageCode } from '../../lib/language';
import { SearchIcon } from './SearchIcon';
import { HeaderCartIcon } from './HeaderCartIcon';
import { LanguageIcon } from './LanguageIcon';
import { ExitIcon } from './ExitIcon';

// Export HeaderCartIcon for use in other components
export { HeaderCartIcon };

// Local image paths - Images stored in public/assets/home/
const imgBorborAguaLogoColorB2024Colored1 = "/assets/home/imgBorborAguaLogoColorB2024Colored1.png";
const imgDanielSinocaAancLsb0SU0Unsplash1 = "/assets/home/imgDanielSinocaAancLsb0SU0Unsplash1.jpg";
const imgIcon2 = "/assets/home/imgIcon2.svg";
const imgSvg = "/assets/home/imgSvg.svg";
const imgSvg1 = "/assets/home/imgSvg1.svg";
const imgGroup = "/assets/home/imgGroup.svg";
const imgLink = "/assets/home/imgLink.svg";
const imgGroup2122 = "/assets/home/imgGroup2122.svg";
const imgGroup2121 = "/assets/home/imgGroup2121.svg";
const imgGroup2124 = "/assets/home/imgGroup2124.svg";
const imgGroup2123 = "/assets/home/imgGroup2123.svg";
const img4 = "/assets/home/img4.svg";

interface HeaderProps {
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
  setShowSearchModal: (show: boolean) => void;
  setShowLanguageMenu: (show: boolean) => void;
  showLanguageMenu: boolean;
  handleLanguageChange: (langCode: LanguageCode) => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  setShowUserMenu: (show: boolean) => void;
  showUserMenu: boolean;
  handleLogout: () => void;
  languageMenuRef: React.RefObject<HTMLDivElement>;
  userMenuRef: React.RefObject<HTMLDivElement>;
  isHomePage?: boolean;
}

export function Header({
  router,
  t,
  setShowSearchModal,
  setShowLanguageMenu,
  showLanguageMenu,
  handleLanguageChange,
  isLoggedIn,
  isAdmin,
  setShowUserMenu,
  showUserMenu,
  handleLogout,
  languageMenuRef,
  userMenuRef,
  isHomePage = false,
}: HeaderProps) {
  // Header positioned on top of white spacer section
  const topPosition = isHomePage 
    ? 'top-[4px] md:top-[40px] sm:top-[4px]'
    : 'top-[80px] md:top-[40px] sm:top-[60px]';
  
  return (
    <>
      {/* Header Section - Navigation Bar */}
      <div className={`fixed bg-[rgba(255,255,255,0.08)] backdrop-blur-[15px] content-stretch flex flex-col h-[65px] md:h-[60px] sm:h-[50px] items-center justify-center left-1/2 px-[32px] md:px-[24px] sm:px-[16px] py-[14px] md:py-[12px] sm:py-[8px] rounded-[60px] md:rounded-[50px] sm:rounded-[40px] ${topPosition} translate-x-[-50%] w-[1200px] lg:w-[1200px] md:w-[90%] sm:w-[95%] z-50 border border-[rgba(255,255,255,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_60px_rgba(98,179,232,0.15)]`}>
        <div className="content-stretch flex gap-[160px] lg:gap-[160px] md:gap-[120px] sm:gap-[16px] h-[50px] md:h-[44px] sm:h-[36px] items-center justify-center relative shrink-0">
          {/* Logo */}
          <div
            onClick={() => router.push('/')}
            className="h-[31px] md:h-[26px] sm:h-[22px] relative shrink-0 w-[101px] md:w-[85px] sm:w-[72px] cursor-pointer"
          >
            <img alt="Borbor Aqua Logo" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full figma-fade-in" src={imgBorborAguaLogoColorB2024Colored1} />
          </div>

          {/* Navigation Menu */}
          <div className="content-stretch flex font-['Inter:Bold',sans-serif] font-bold gap-[60px] lg:gap-[60px] md:gap-[24px] sm:gap-[12px] items-end justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-white uppercase whitespace-nowrap sm:hidden md:flex">
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
          <div className="content-stretch flex gap-[28px] lg:gap-[28px] md:gap-[20px] sm:gap-[12px] items-center justify-center relative shrink-0">
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
    </>
  );
}

interface FooterProps {
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
  isHomePage?: boolean;
}

export function Footer({ router, t, isHomePage = false }: FooterProps) {
  return (
    <>
      {/* Footer */}
      <div className={`relative h-[620px] lg:h-[620px] md:h-[600px] sm:h-[500px] left-0 w-full overflow-hidden ${isHomePage ? 'mt-[5550px] lg:mt-[5550px] md:mt-[5000px] sm:mt-[4000px]' : ''}`}>
        {/* Footer Background Image - daniel sinoca */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img 
            alt="Footer Background" 
            className="absolute h-[144.5%] left-0 max-w-none top-[-44.62%] w-full" 
            src={imgDanielSinocaAancLsb0SU0Unsplash1}
            onError={(e) => {
              console.error('❌ [FOOTER] Failed to load Daniel Sinoca image:', imgDanielSinocaAancLsb0SU0Unsplash1);
            }}
            onLoad={() => {
              console.log('✅ [FOOTER] Daniel Sinoca image loaded:', imgDanielSinocaAancLsb0SU0Unsplash1);
            }}
          />
        </div>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0" />
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
          <div className="absolute border-[#e2e8f0] border-solid border-t content-stretch flex items-center justify-between left-0 right-0 px-[20px] lg:px-[20px] md:px-[16px] sm:px-[12px] pt-[36px] lg:pt-[36px] md:pt-[32px] sm:pt-[24px] top-[350px] lg:top-[350px] md:top-[320px] sm:top-[280px] w-full flex-col sm:flex-col md:flex-row">
            <div className="relative shrink-0">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center relative">
                <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] lg:text-[12px] md:text-[11px] sm:text-[10px] text-white whitespace-nowrap">
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
    </>
  );
}

interface ButtonProps {
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
}

export function Button({ router, t }: ButtonProps) {
  return (
    <>
      {/* Buttons */}
      <div className="content-center flex flex-wrap gap-[0px_14px] lg:gap-[0px_14px] md:gap-[0px_12px] sm:gap-[0px_8px] h-[68px] lg:h-[68px] md:h-[64px] sm:h-[56px] items-center justify-center pt-[14px] lg:pt-[14px] md:pt-[12px] sm:pt-[8px] relative shrink-0 w-full">
        <div
          onClick={() => router.push('/products')}
          className="bg-[#1ac0fd] content-stretch flex flex-col h-[54px] lg:h-[54px] md:h-[52px] sm:h-[44px] items-center justify-center pl-[54px] pr-[52px] lg:pl-[54px] lg:pr-[52px] md:pl-[48px] md:pr-[46px] sm:pl-[32px] sm:pr-[30px] py-[14px] lg:py-[14px] md:py-[12px] sm:py-[10px] relative rounded-[9999px] shrink-0 w-[165px] lg:w-[165px] md:w-[160px] sm:w-[140px] cursor-pointer hover:bg-[#00b8e6] transition-colors"
        >
          <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-white whitespace-nowrap">
            <p className="leading-[22px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px]">{t('home.hero.shopNow')}</p>
          </div>
        </div>
        <div
          onClick={() => router.push('/about')}
          className="bg-[rgba(0,0,0,0)] content-stretch flex flex-col h-[54px] lg:h-[54px] md:h-[52px] sm:h-[44px] items-center justify-center px-[36px] lg:px-[36px] md:px-[32px] sm:px-[24px] py-[14px] lg:py-[14px] md:py-[12px] sm:py-[10px] relative rounded-[9999px] shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[17px] lg:h-[17px] md:h-[17px] sm:h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-white w-[80px] lg:w-[80px] md:w-[75px] sm:w-[65px]">
            <p className="leading-[22px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px] whitespace-pre-wrap">{t('home.hero.learnMore')}</p>
          </div>
        </div>
      </div>
    </>
  );
}

interface ArrowIconProps {
  className?: string;
}

export function ArrowIcon({ className = "block max-w-none size-full" }: ArrowIconProps) {
  return (
    <img alt="Arrow" className={className} src={img4} />
  );
}

interface ViewAllProductsButtonProps {
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
  isMobile?: boolean;
}

export function ViewAllProductsButton({ router, t, isMobile = false }: ViewAllProductsButtonProps) {
  if (isMobile) {
    return (
      <>
        {/* Mobile View All Products Button */}
        <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center left-[calc(50%+1.5px)] top-[1708px] w-[241px]">
          <button
            onClick={() => router.push('/products')}
            className="border-2 border-[#e2e8f0] border-solid content-stretch flex gap-[8px] items-center px-[34px] py-[12px] relative rounded-[9999px] shrink-0 transition-all duration-300 hover:border-[#1ac0fd] hover:bg-[#1ac0fd]/5 hover:shadow-md hover:shadow-[#1ac0fd]/20 hover:scale-105 active:scale-95"
          >
            <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[16px] text-center whitespace-nowrap">
              <p className="leading-[24px]">{t('home.featuredProducts.viewAllProducts')}</p>
            </div>
            <div className="relative shrink-0">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative">
                <div className="flex items-center justify-center relative shrink-0">
                  <div className="flex-none scale-y-[-100%]">
                    <div className="h-[28px] relative w-[24.02px]">
                      <ArrowIcon />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* View All Products Button */}
      <div className="absolute content-stretch flex flex-col items-center left-[20px] lg:left-[20px] md:left-[16px] sm:left-[12px] right-[20px] lg:right-[20px] md:right-[16px] sm:right-[12px] top-[680px] lg:top-[680px] md:top-[480px] sm:top-[430px]">
        <div
          onClick={() => router.push('/products')}
          className="border-2 border-[#e2e8f0] border-solid content-stretch flex gap-[7px] lg:gap-[7px] md:gap-[6px] sm:gap-[4px] items-center px-[30px] lg:px-[30px] md:px-[28px] sm:px-[20px] py-[10px] lg:py-[10px] md:py-[10px] sm:py-[8px] relative rounded-[9999px] shrink-0 cursor-pointer hover:border-[#00d1ff] hover:bg-[#00d1ff]/5 transition-all"
        >
          <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[14px] lg:text-[14px] md:text-[14px] sm:text-[12px] text-center whitespace-nowrap">
            <p className="leading-[22px] lg:leading-[22px] md:leading-[20px] sm:leading-[18px]">{t('home.featuredProducts.viewAllProducts')}</p>
          </div>
          <div className="relative shrink-0">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative">
              <div className="flex items-center justify-center relative shrink-0">
                <div className="flex-none scale-y-[-100%]">
                  <div className="h-[28px] relative w-[24.02px]">
                    <ArrowIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

