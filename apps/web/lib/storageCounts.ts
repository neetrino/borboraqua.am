'use client';

/**
 * Shared storage keys used to keep cart data in localStorage.
 */
export const STORAGE_KEYS = {
  cart: 'shop_cart_guest',
} as const;

export const CART_KEY = STORAGE_KEYS.cart;

