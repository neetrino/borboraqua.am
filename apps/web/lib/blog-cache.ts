'use client';

import { BLOG_VIEW_CACHE_KEY, BLOG_VIEW_CACHE_TTL_SEC } from './storageCounts';

export interface BlogListCacheEntry {
  data: unknown[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  lang: string;
  page: number;
  limit: number;
  timestamp: number;
}

/**
 * Reads blog list from cache if it matches lang + page + limit and is not expired.
 */
export function getBlogFromCache(
  lang: string,
  page: number,
  limit: number
): { data: unknown[]; meta: BlogListCacheEntry['meta'] } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(BLOG_VIEW_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as BlogListCacheEntry;
    const now = Date.now();
    if (entry.lang !== lang || entry.page !== page || entry.limit !== limit) return null;
    if ((now - entry.timestamp) / 1000 > BLOG_VIEW_CACHE_TTL_SEC) return null;
    return { data: entry.data, meta: entry.meta };
  } catch {
    return null;
  }
}

/**
 * Saves blog list response to cache.
 */
export function setBlogCache(
  lang: string,
  page: number,
  limit: number,
  data: unknown[],
  meta: BlogListCacheEntry['meta']
): void {
  if (typeof sessionStorage === 'undefined') return;
  if (data.length === 0) return;
  try {
    const entry: BlogListCacheEntry = {
      data,
      meta,
      lang,
      page,
      limit,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(BLOG_VIEW_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

/**
 * Clears blog list cache.
 */
export function clearBlogCache(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(BLOG_VIEW_CACHE_KEY);
  } catch {
    // ignore
  }
}
