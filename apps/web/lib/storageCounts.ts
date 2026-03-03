'use client';

/**
 * Shared storage keys used to keep cart data in localStorage.
 */
export const STORAGE_KEYS = {
  cart: 'shop_cart_guest',
  /** Cache for built cart view (Cart + product details), same TTL idea as products cache. */
  cartViewCache: 'shop_cart_view_cache',
  /** Cache for blog list view (posts + meta), same TTL idea as products cache. */
  blogViewCache: 'shop_blog_view_cache',
  /** Cache for related products carousel (single product page), same TTL as products. */
  relatedProductsViewCache: 'shop_related_products_view_cache',
} as const;

export const CART_KEY = STORAGE_KEYS.cart;
export const CART_VIEW_CACHE_KEY = STORAGE_KEYS.cartViewCache;
export const BLOG_VIEW_CACHE_KEY = STORAGE_KEYS.blogViewCache;
export const RELATED_PRODUCTS_VIEW_CACHE_KEY = STORAGE_KEYS.relatedProductsViewCache;

/** TTL for cart view cache (seconds). 1 minute. */
export const CART_VIEW_CACHE_TTL_SEC = 60;

/** TTL for blog list view cache (seconds). 15 minutes. */
export const BLOG_VIEW_CACHE_TTL_SEC = 900;

/** TTL for related products carousel cache (seconds). */
export const RELATED_PRODUCTS_VIEW_CACHE_TTL_SEC = 60;

