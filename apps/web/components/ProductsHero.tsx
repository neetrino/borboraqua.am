'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';
type PriceFilter = 'all' | 'low' | 'high';
type ViewMode = 'grid-2' | 'list';

interface ProductsHeroProps {
  total?: number;
}

export function ProductsHero({ total = 0 }: ProductsHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid-2');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
  ];

  // Load from URL params
  useEffect(() => {
    const sortParam = searchParams.get('sort') as SortOption;
    const priceParam = searchParams.get('price') as PriceFilter;
    const viewParam = searchParams.get('view');

    if (sortParam && sortOptions.some(opt => opt.value === sortParam)) {
      setSortBy(sortParam);
    }
    if (priceParam && ['all', 'low', 'high'].includes(priceParam)) {
      setPriceFilter(priceParam);
    }
    if (viewParam) {
      // Map 'grid' from URL to 'grid-2' for internal state
      const mappedView: ViewMode = viewParam === 'grid' ? 'grid-2' : (viewParam === 'list' ? 'list' : 'grid-2');
      setViewMode(mappedView);
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

  const handlePriceFilterChange = (filter: PriceFilter) => {
    setPriceFilter(filter);
    
    const params = new URLSearchParams(searchParams.toString());
    if (filter === 'all') {
      params.delete('price');
    } else {
      params.set('price', filter);
      // Apply sort based on filter
      if (filter === 'low') {
        params.set('sort', 'price-asc');
        setSortBy('price-asc');
      } else if (filter === 'high') {
        params.set('sort', 'price-desc');
        setSortBy('price-desc');
      }
    }
    params.delete('page');
    
    router.push(`/products?${params.toString()}`);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    
    const params = new URLSearchParams(searchParams.toString());
    // Map 'grid-2' to 'grid' for URL compatibility
    params.set('view', mode === 'grid-2' ? 'grid' : mode);
    
    router.replace(`/products?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="relative w-full" data-node-id="4:1680">
      {/* Results Count Text */}
      {total > 0 && (
        <div className="flex items-center justify-between mb-3" data-name="Group 2143" data-node-id="4:1711">
          <p className="font-['Montserrat',sans-serif] font-semibold text-sm text-[rgba(0,0,0,0.87)]">
            <span className="font-['Montserrat',sans-serif] font-semibold text-[rgba(129,129,129,0.87)]">Home</span>
            <span> / Products</span>
          </p>
          <p className="font-['Montserrat',sans-serif] font-bold text-sm text-[rgba(0,0,0,0.87)]" data-node-id="4:1712">
            Show {total} Results
          </p>
        </div>
      )}

      {/* Hero Section Container - Compact Layout */}
      <div className="flex items-center gap-3 ml-auto mr-0 max-w-2xl py-3" data-name="Hero" data-node-id="4:1681">
        {/* Left: Sort by dropdown */}
        <div className="flex items-center" data-name="Sort by" data-node-id="4:1682">
          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="bg-[rgba(255,255,255,0.33)] h-9 overflow-hidden rounded-full w-28 flex items-center justify-between px-2.5"
              data-name="Sort Active"
              data-node-id="4:1683"
            >
              <span className="font-['Montserrat',sans-serif] font-semibold text-xs text-[rgba(0,0,0,0.87)]">
                Sort by
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
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
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

        {/* Center: Price Filter Tabs */}
        <div className="relative flex-shrink-0" data-name="Tab" data-node-id="4:1706">
          <div className="bg-[rgba(250,254,255,0.33)] h-9 overflow-hidden rounded-full w-72 relative">
            {/* Active tab background */}
            <div
              className="absolute bg-[#00d1ff] rounded-full transition-all duration-300"
              style={{
                left: priceFilter === 'all' ? '1.45%' : priceFilter === 'low' ? '33.69%' : '66.58%',
                right: priceFilter === 'all' ? '77.07%' : priceFilter === 'low' ? '44.47%' : '10.24%',
                top: '7.74%',
                bottom: '8.93%',
              }}
              data-name="Rectangle"
              data-node-id="4:1707"
            />
            
            {/* Tab buttons */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => handlePriceFilterChange('all')}
                className="absolute left-[9.16%] right-[84.91%] font-['Montserrat',sans-serif] font-semibold text-xs text-center top-1/2 -translate-y-1/2 z-10"
                data-node-id="4:1708"
              >
                <span className={priceFilter === 'all' ? 'text-white' : 'text-[#1b1f21]'}>
                  All
                </span>
              </button>
              
              <button
                onClick={() => handlePriceFilterChange('low')}
                className="absolute left-[33.69%] right-[44.47%] font-['Montserrat',sans-serif] font-semibold text-xs text-center top-1/2 -translate-y-1/2 z-10"
                data-node-id="4:1709"
              >
                <span className={priceFilter === 'low' ? 'text-white' : 'text-[#1b1f21]'}>
                  Low Price
                </span>
              </button>
              
              <button
                onClick={() => handlePriceFilterChange('high')}
                className="absolute left-[66.58%] right-[10.24%] font-['Montserrat',sans-serif] font-semibold text-xs text-center top-1/2 -translate-y-1/2 z-10"
                data-node-id="4:1710"
              >
                <span className={priceFilter === 'high' ? 'text-white' : 'text-[#1b1f21]'}>
                  High Price
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: View Mode Toggle */}
        <div className="relative flex-shrink-0" data-name="View" data-node-id="4:1689">
          <div className="bg-[rgba(255,255,255,0.33)] h-9 rounded-full w-24 relative overflow-hidden">
            {/* Active view indicator */}
            <div
              className="absolute bg-[rgba(8,202,244,0.7)] h-9 rounded-bl-2xl rounded-tl-2xl transition-all duration-300"
              style={{
                left: 0,
                width: viewMode === 'grid-2' ? '52%' : '48%',
              }}
              data-node-id="4:1693"
            />
            
            {/* Grid View Button */}
            <button
              onClick={() => handleViewModeChange('grid-2')}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center z-10"
              data-name="Grid"
              data-node-id="4:1694"
            >
              <div className="grid grid-cols-2 gap-0.5">
                <div className="bg-white h-1.5 rounded w-1.5" />
                <div className="bg-white h-1.5 rounded w-1.5" />
                <div className="bg-white h-1.5 rounded w-1.5" />
                <div className="bg-white h-1.5 rounded w-1.5" />
              </div>
            </button>
            
            {/* List View Button */}
            <button
              onClick={() => handleViewModeChange('list')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex flex-col gap-0.5 z-10"
              data-name="List"
              data-node-id="4:1699"
            >
              <div className="bg-[#1a1f21] h-0.5 rounded w-1" />
              <div className="bg-[#1a1f21] h-0.5 rounded w-2.5" />
              <div className="bg-[#1a1f21] h-0.5 rounded w-1" />
              <div className="bg-[#1a1f21] h-0.5 rounded w-2.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
