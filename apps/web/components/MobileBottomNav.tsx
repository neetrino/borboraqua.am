'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Home, UserRound, Store } from 'lucide-react';
import { CartIcon } from './icons/CartIcon';

interface MobileNavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  onClick?: () => void;
  visible?: boolean;
}

/**
 * Ստեղծում է հաստատուն mobile նավիգացիոն վահանակ՝ էջի ներքևում,
 * որպեսզի հիմնական գործողությունները միշտ լինեն ձեռքի տակ փոքր էկրաններում։
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const isProductsPage = pathname?.startsWith('/products');

  const navItems: MobileNavItem[] = useMemo(
    () => [
      { 
        label: 'Home', 
        href: '/', 
        icon: Home, 
        visible: true,
      },
      // Shop with Store icon
      { 
        label: 'Shop', 
        href: '/products', 
        icon: Store, 
        visible: true,
        onClick: () => console.info('🛒 [MobileBottomNav] Shop tapped, navigating to /products'),
      },
      { 
        label: 'Cart', 
        href: '/cart', 
        icon: CartIcon, 
        visible: true,
      },
      { label: 'My account', href: '/profile', icon: UserRound, visible: true },
    ],
    [isProductsPage]
  );


  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {navItems.filter(item => item.visible).map(({ label, href, icon: Icon, action, onClick }) => {
          const isActive = href ? pathname === href : false;

          const content = (
            <>
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
              </div>
              <span className="mt-1 text-[11px]">{label}</span>
            </>
          );

          if (action) {
            return (
              <button
                key={label}
                type="button"
                onClick={action}
                className="flex flex-1 flex-col items-center rounded-xl px-2 py-1 text-xs font-medium text-gray-500 transition"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={label}
              href={href || '#'}
              onClick={onClick}
              className={`flex flex-1 flex-col items-center rounded-xl px-2 py-1 text-xs font-medium transition ${
                isActive ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

