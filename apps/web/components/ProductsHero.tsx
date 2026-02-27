'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../lib/i18n-client';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

interface ProductsHeroProps {
  total?: number;
}

export function ProductsHero({ total = 0 }: ProductsHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'default', label: t('products.hero.default') },
    { value: 'name-asc', label: t('products.hero.nameAsc') },
    { value: 'name-desc', label: t('products.hero.nameDesc') },
  ];

  // Load from URL params
  useEffect(() => {
    const sortParam = searchParams.get('sort') as SortOption;
    if (sortParam && sortOptions.some(opt => opt.value === sortParam)) {
      setSortBy(sortParam);
    }
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setShowSortDropdown(false);
    
    const params = new URLSearchParams(searchParams.toString());
    if (option === 'default') {
      params.delete('sort');
    } else {
      params.set('sort', option);
    }
    params.delete('page');
    
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="relative w-full" data-node-id="4:1680">
      {/* Hero Section Container - Compact Layout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 mb-0 gap-3 sm:gap-0" data-name="Hero" data-node-id="4:1681">
        {/* Left: Show Results Text */}
        {total > 0 && (
          <p className="font-['Montserrat',sans-serif] font-bold text-sm text-[rgba(0,0,0,0.87)] whitespace-nowrap" data-node-id="4:1712">
            {t('products.hero.showResults').replace('{total}', total.toString())}
          </p>
        )}
        
        {/* Right: Filters Container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto sm:ml-auto">
        {/* Sort by dropdown */}
        <div className="flex items-center w-full sm:w-auto" data-name="Sort by" data-node-id="4:1682">
          <div className="relative w-full sm:w-auto" ref={sortDropdownRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="bg-[rgba(255,255,255,0.33)] h-9 overflow-hidden rounded-full w-full sm:w-28 flex items-center justify-between px-2.5"
              data-name="Sort Active"
              data-node-id="4:1683"
            >
              <span className="font-['Montserrat',sans-serif] font-semibold text-xs text-[rgba(0,0,0,0.87)]">
                {sortOptions.find(opt => opt.value === sortBy)?.label ?? t('products.hero.sortBy')}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 23 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
                data-name="android-arrow-up"
                data-node-id="4:1686"
              >
                <path
                  d="M11.5 16L5 9.5L6.5 8L11.5 13L16.5 8L18 9.5L11.5 16Z"
                  fill="rgba(0,0,0,0.87)"
                />
              </svg>
            </button>

            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      sortBy === option.value
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>

      </div>
    </div>
  );
}
