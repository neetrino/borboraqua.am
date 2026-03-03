'use client';

import { CART_VIEW_CACHE_KEY, CART_VIEW_CACHE_TTL_SEC } from './storageCounts';

export interface CartCacheEntry {
  cart: {
    id: string;
    items: unknown[];
    totals: { subtotal: number; discount: number; shipping: number; tax: number; total: number; currency: string };
    itemsCount: number;
  };
  guestCartJson: string;
  lang: string;
  timestamp: number;
}

/**
 * Reads cart view from cache if it matches current guest cart + lang and is not expired.
 * Same idea as products cache: use cached data when valid.
 */
export function getCartFromCache(
  guestCartJson: string,
  lang: string
): CartCacheEntry['cart'] | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CART_VIEW_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CartCacheEntry;
    const now = Date.now();
    if (entry.guestCartJson !== guestCartJson || entry.lang !== lang) return null;
    if ((now - entry.timestamp) / 1000 > CART_VIEW_CACHE_TTL_SEC) return null;
    return entry.cart;
  } catch {
    return null;
  }
}

/**
 * Saves built cart view to cache (guestCart + lang + cart + timestamp).
 */
export function setCartCache(
  guestCartJson: string,
  lang: string,
  cart: CartCacheEntry['cart']
): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const entry: CartCacheEntry = {
      cart,
      guestCartJson,
      lang,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CART_VIEW_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

/**
 * Clears cart view cache (e.g. when cart is updated elsewhere).
 */
export function clearCartCache(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(CART_VIEW_CACHE_KEY);
  } catch {
    // ignore
  }
}
