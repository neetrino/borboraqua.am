'use client';

import React from 'react';
import type { SearchResult } from '../hooks/useInstantSearch';

export interface SearchDropdownProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  selectedIndex: number;
  query: string;
  onResultClick: (result: SearchResult) => void;
  onClose: () => void;
  onSeeAll?: (query: string) => void;
  className?: string;
  t?: (key: string) => string;
  formatPrice?: (price: number) => string;
}

const defaultT = (key: string) => key;
const defaultFormatPrice = (price: number) => `${price} ֏`;

export function SearchDropdown({
  results,
  loading,
  error,
  isOpen,
  selectedIndex,
  query,
  onResultClick,
  onClose,
  onSeeAll,
  className = '',
  t = defaultT,
  formatPrice = defaultFormatPrice,
}: SearchDropdownProps) {
  if (!isOpen) return null;

  return (
    <div
      id="search-results"
      role="listbox"
      aria-label={t('home.search.resultsLabel') || 'Search results'}
      className={`absolute left-0 right-0 top-full z-[210] mt-1 max-h-[min(70vh,400px)] overflow-y-auto rounded-xl border border-white/30 bg-white/10 backdrop-blur-xl shadow-lg ${className}`}
    >
      <div className="p-2">
        {loading && (
          <div className="py-6 text-center text-sm text-white/90">
            {t('home.search.searching') || 'Փնտրում...'}
          </div>
        )}
        {error && !loading && (
          <div className="py-4 text-center text-sm text-red-200">
            {error}
          </div>
        )}
        {!loading && !error && results.length === 0 && query.trim() && (
          <div className="py-6 text-center text-sm text-white/90">
            {t('home.search.noResults') || 'Արտադրանք չի գտնվել'}
          </div>
        )}
        {!loading && !error && results.length > 0 && (
          <ul className="space-y-1" role="group">
            {results.map((result, index) => (
              <li key={result.id} role="option" aria-selected={index === selectedIndex}>
                <button
                  type="button"
                  onClick={() => onResultClick(result)}
                  className={`flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-white/25 text-white'
                      : 'hover:bg-white/15 text-white/95'
                  }`}
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white/20">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full bg-white/10" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[15px] leading-tight text-white line-clamp-2">
                      {result.name}
                    </div>
                    {result.category && (
                      <div className="text-xs font-medium text-white/80 uppercase tracking-wide mt-0.5">
                        {result.category}
                      </div>
                    )}
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-bold text-[15px] text-[#b3e5fc]">
                        {formatPrice(result.price)}
                      </span>
                      {result.salePrice != null && result.salePrice > result.price && (
                        <span className="text-xs font-medium text-white/60 line-through">
                          {formatPrice(result.salePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {query.trim() && !loading && (
        <div className="border-t border-white/20 p-2">
          <button
            type="button"
            onClick={() => {
              if (onSeeAll) {
                onSeeAll(query.trim());
                onClose();
              } else {
                window.location.href = `/products?search=${encodeURIComponent(query.trim())}`;
                onClose();
              }
            }}
            className="block w-full rounded-lg py-2 text-center text-sm font-medium text-[#b3e5fc] hover:bg-white/15"
          >
            {t('home.search.seeAll') || 'Տեսնել բոլորը'}
          </button>
        </div>
      )}
    </div>
  );
}
