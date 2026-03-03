'use client';

import {
  RELATED_PRODUCTS_VIEW_CACHE_KEY,
  RELATED_PRODUCTS_VIEW_CACHE_TTL_SEC,
} from './storageCounts';

export interface RelatedProductsCacheEntry {
  data: unknown[];
  categoryKey: string; // categorySlug or 'all'
  lang: string;
  timestamp: number;
}

/**
 * Reads related products list from cache if it matches categoryKey + lang and is not expired.
 */
export function getRelatedProductsFromCache(
  categorySlug: string | undefined,
  lang: string
): unknown[] | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(RELATED_PRODUCTS_VIEW_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as RelatedProductsCacheEntry;
    const categoryKey = categorySlug ?? 'all';
    const now = Date.now();
    if (entry.categoryKey !== categoryKey || entry.lang !== lang) return null;
    if ((now - entry.timestamp) / 1000 > RELATED_PRODUCTS_VIEW_CACHE_TTL_SEC) return null;
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Saves related products API response to cache.
 */
export function setRelatedProductsCache(
  categorySlug: string | undefined,
  lang: string,
  data: unknown[]
): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const entry: RelatedProductsCacheEntry = {
      data,
      categoryKey: categorySlug ?? 'all',
      lang,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(RELATED_PRODUCTS_VIEW_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

/**
 * Clears related products carousel cache.
 */
export function clearRelatedProductsCache(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(RELATED_PRODUCTS_VIEW_CACHE_KEY);
  } catch {
    // ignore
  }
}
