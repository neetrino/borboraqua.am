'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { Breadcrumb } from './Breadcrumb';
import { MobileBottomNav } from './MobileBottomNav';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  if (isHomePage) {
    // Home page has its own Header/Footer in the design
    // No viewport sizing, no overflow restrictions, no flex - let it scroll naturally
    // Container will be exactly 1920px width as per Figma design
    return (
      <main className="w-full" style={{ minHeight: 'auto', height: 'auto' }}>
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

