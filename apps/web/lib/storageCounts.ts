'use client';

/**
 * Shared storage keys used to keep cart data in localStorage.
 */
export const STORAGE_KEYS = {
  cart: 'shop_cart_guest',
  /** Cache for blog list view (posts + meta), same TTL idea as products cache. */
  blogViewCache: 'shop_blog_view_cache',
  /** Cache for related products carousel (single product page), same TTL as products. */
  relatedProductsViewCache: 'shop_related_products_view_cache',
} as const;

export const CART_KEY = STORAGE_KEYS.cart;
export const BLOG_VIEW_CACHE_KEY = STORAGE_KEYS.blogViewCache;
export const RELATED_PRODUCTS_VIEW_CACHE_KEY = STORAGE_KEYS.relatedProductsViewCache;

/** TTL for blog list view cache (seconds). 10 minutes. */
export const BLOG_VIEW_CACHE_TTL_SEC = 600;

/** TTL for related products carousel cache (seconds). */
export const RELATED_PRODUCTS_VIEW_CACHE_TTL_SEC = 600;

