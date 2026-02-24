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
      className={`absolute left-0 right-0 top-full z-[210] mt-1 max-h-[min(70vh,400px)] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg ${className}`}
    >
      <div className="p-2">
        {loading && (
          <div className="py-6 text-center text-sm text-gray-500">
            {t('home.search.searching') || 'Փնտրում...'}
          </div>
        )}
        {error && !loading && (
          <div className="py-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}
        {!loading && !error && results.length === 0 && query.trim() && (
          <div className="py-6 text-center text-sm text-gray-500">
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
                  className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-[#1ac0fd]/15 text-gray-900'
                      : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 line-clamp-1">
                      {result.name}
                    </div>
                    {result.category && (
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        {result.category}
                      </div>
                    )}
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="font-semibold text-[#1ac0fd]">
                        {formatPrice(result.price)}
                      </span>
                      {result.salePrice != null && result.salePrice > result.price && (
                        <span className="text-xs text-gray-400 line-through">
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
        <div className="border-t border-gray-100 p-2">
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
            className="block w-full rounded-lg py-2 text-center text-sm font-medium text-[#1ac0fd] hover:bg-[#1ac0fd]/10"
          >
            {t('home.search.seeAll') || 'Տեսնել բոլորը'}
          </button>
        </div>
      )}
    </div>
  );
}
