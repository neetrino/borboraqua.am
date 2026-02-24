'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getStoredLanguage } from '../lib/language';

export interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  image: string | null;
  category: string;
  slug: string;
  type: 'product';
}

export interface UseInstantSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
}

export function useInstantSearch(options: UseInstantSearchOptions = {}) {
  const {
    debounceMs = 200,
    minQueryLength = 2,
    maxResults = 8,
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minQueryLength) {
        setResults([]);
        setLoading(false);
        return;
      }

      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();
      setLoading(true);
      setError(null);

      const lang = getStoredLanguage();
      const params = new URLSearchParams({
        q: searchQuery,
        limit: String(maxResults),
        lang,
      });

      try {
        const res = await fetch(`/api/search/instant?${params.toString()}`, {
          signal: abortRef.current.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error ?? 'Search failed');
          setResults([]);
          return;
        }

        setResults(Array.isArray(data.results) ? data.results : []);
        setSelectedIndex(-1);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [minQueryLength, maxResults]
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const trimmed = query.trim();
    if (trimmed.length < minQueryLength) {
      setResults([]);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      performSearch(trimmed);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounceMs, minQueryLength, performSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) {
        if (e.key === 'Escape') setIsOpen(false);
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
        default:
          break;
      }
    },
    [isOpen, results.length]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setLoading(false);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    clearSearch,
  };
}
