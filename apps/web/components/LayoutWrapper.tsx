'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Breadcrumb } from './Breadcrumb';
import { MobileBottomNav } from './MobileBottomNav';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const wrapperRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isHomePage && wrapperRef.current) {
      const updateHeight = () => {
        const viewportWidth = window.innerWidth;
        const scale = Math.min(viewportWidth / 1920, 1);
        const scaledHeight = 6637 * scale;
        wrapperRef.current!.style.minHeight = `${scaledHeight}px`;
        wrapperRef.current!.style.height = `${scaledHeight}px`;
      };

      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [isHomePage]);

  if (isHomePage) {
    // Home page has its own Header/Footer in the design
    // No viewport sizing, no overflow restrictions, no flex - let it scroll naturally
    // Container will be exactly 1920px width as per Figma design
    return (
      <main ref={wrapperRef} className="w-full home-page-wrapper">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
      <Header />
      <Breadcrumb />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

