/**
 * i18n helper functions according to plan.md and structure.md
 * Server-side translation functions (can be used in Server Components)
 * For client-side React hooks, see i18n-client.ts
 */

import { type LanguageCode } from './language';
import { getStoredLanguage } from './language';

// Pre-load all translations at build time for optimal performance
import enCommon from '../locales/en/common.json';
import enHome from '../locales/en/home.json';
import enProduct from '../locales/en/product.json';
import enProducts from '../locales/en/products.json';
import enDelivery from '../locales/en/delivery.json';
import enAbout from '../locales/en/about.json';
import enContact from '../locales/en/contact.json';
import enFaq from '../locales/en/faq.json';
import enLogin from '../locales/en/login.json';
import enDeliveryTerms from '../locales/en/delivery-terms.json';
import enTerms from '../locales/en/terms.json';
import enPrivacy from '../locales/en/privacy.json';
import enSupport from '../locales/en/support.json';
import enStores from '../locales/en/stores.json';
import enReturns from '../locales/en/returns.json';
import enProfile from '../locales/en/profile.json';
import enCheckout from '../locales/en/checkout.json';
import enRegister from '../locales/en/register.json';
import enCategories from '../locales/en/categories.json';
import enOrders from '../locales/en/orders.json';
import enAdmin from '../locales/en/admin.json';
import enBlog from '../locales/en/blog.json';

import hyCommon from '../locales/hy/common.json';
import hyHome from '../locales/hy/home.json';
import hyProduct from '../locales/hy/product.json';
import hyProducts from '../locales/hy/products.json';
import hyDelivery from '../locales/hy/delivery.json';
import hyAbout from '../locales/hy/about.json';
import hyContact from '../locales/hy/contact.json';
import hyFaq from '../locales/hy/faq.json';
import hyLogin from '../locales/hy/login.json';
import hyDeliveryTerms from '../locales/hy/delivery-terms.json';
import hyTerms from '../locales/hy/terms.json';
import hyPrivacy from '../locales/hy/privacy.json';
import hySupport from '../locales/hy/support.json';
import hyStores from '../locales/hy/stores.json';
import hyReturns from '../locales/hy/returns.json';
import hyProfile from '../locales/hy/profile.json';
import hyCheckout from '../locales/hy/checkout.json';
import hyRegister from '../locales/hy/register.json';
import hyCategories from '../locales/hy/categories.json';
import hyOrders from '../locales/hy/orders.json';
import hyAdmin from '../locales/hy/admin.json';
import hyBlog from '../locales/hy/blog.json';

import ruCommon from '../locales/ru/common.json';
import ruHome from '../locales/ru/home.json';
import ruProduct from '../locales/ru/product.json';
import ruProducts from '../locales/ru/products.json';
import ruDelivery from '../locales/ru/delivery.json';
import ruAbout from '../locales/ru/about.json';
import ruContact from '../locales/ru/contact.json';
import ruFaq from '../locales/ru/faq.json';
import ruLogin from '../locales/ru/login.json';
import ruDeliveryTerms from '../locales/ru/delivery-terms.json';
import ruTerms from '../locales/ru/terms.json';
import ruPrivacy from '../locales/ru/privacy.json';
import ruSupport from '../locales/ru/support.json';
import ruStores from '../locales/ru/stores.json';
import ruReturns from '../locales/ru/returns.json';
import ruProfile from '../locales/ru/profile.json';
import ruCheckout from '../locales/ru/checkout.json';
import ruRegister from '../locales/ru/register.json';
import ruCategories from '../locales/ru/categories.json';
import ruOrders from '../locales/ru/orders.json';
import ruAdmin from '../locales/ru/admin.json';
import ruBlog from '../locales/ru/blog.json';

// Type definitions for better type safety
export type Namespace = 'common' | 'home' | 'product' | 'products' | 'delivery' | 'about' | 'contact' | 'faq' | 'login' | 'delivery-terms' | 'terms' | 'privacy' | 'support' | 'stores' | 'returns' | 'profile' | 'checkout' | 'register' | 'categories' | 'orders' | 'admin' | 'blog';
export type ProductField = 'title' | 'shortDescription' | 'longDescription';

// Translation store - organized by language and namespace
// Supports en, hy, and ru languages
const translations: Partial<Record<LanguageCode, Record<Namespace, any>>> = {
  en: {
    common: enCommon,
    home: enHome,
    product: enProduct,
    products: enProducts,
    delivery: enDelivery,
    about: enAbout,
    contact: enContact,
    faq: enFaq,
    login: enLogin,
    'delivery-terms': enDeliveryTerms,
    terms: enTerms,
    privacy: enPrivacy,
    support: enSupport,
    stores: enStores,
    returns: enReturns,
    profile: enProfile,
    checkout: enCheckout,
    register: enRegister,
    categories: enCategories,
    orders: enOrders,
    admin: enAdmin,
    blog: enBlog,
  },
  hy: {
    common: hyCommon,
    home: hyHome,
    product: hyProduct,
    products: hyProducts,
    delivery: hyDelivery,
    about: hyAbout,
    contact: hyContact,
    faq: hyFaq,
    login: hyLogin,
    'delivery-terms': hyDeliveryTerms,
    terms: hyTerms,
    privacy: hyPrivacy,
    support: hySupport,
    stores: hyStores,
    returns: hyReturns,
    profile: hyProfile,
    checkout: hyCheckout,
    register: hyRegister,
    categories: hyCategories,
    orders: hyOrders,
    admin: hyAdmin,
    blog: hyBlog,
  },
  ru: {
    common: ruCommon,
    home: ruHome,
    product: ruProduct,
    products: ruProducts,
    delivery: ruDelivery,
    about: ruAbout,
    contact: ruContact,
    faq: ruFaq,
    login: ruLogin,
    'delivery-terms': ruDeliveryTerms,
    terms: ruTerms,
    privacy: ruPrivacy,
    support: ruSupport,
    stores: ruStores,
    returns: ruReturns,
    profile: ruProfile,
    checkout: ruCheckout,
    register: ruRegister,
    categories: ruCategories,
    orders: ruOrders,
    admin: ruAdmin,
    blog: ruBlog,
  },
};

// Cache for resolved translation paths (performance optimization)
const translationCache = new Map<string, string>();

/**
 * Get nested value from object by path array
 * @param obj - Object to traverse
 * @param keys - Array of keys to navigate
 * @returns The value at the path or null
 */
function getNestedValue(obj: any, keys: string[]): any {
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  return current;
}

/**
 * Load a translation namespace for a given language
 * @param lang - Language code
 * @param namespace - Namespace name
 * @returns Translation object or null
 */
export function loadTranslation(lang: LanguageCode, namespace: Namespace): any {
  try {
    return translations[lang]?.[namespace] || null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Failed to load translation: ${lang}/${namespace}`, error);
    }
    return null;
  }
}

/**
 * Translation function: t(lang, path)
 * Path format: "namespace.key" (e.g., "common.buttons.addToCart")
 * 
 * Features:
 * - Automatic fallback to English
 * - Path caching for performance
 * - Type-safe namespace validation
 * 
 * @param lang - Language code (optional, uses stored language if not provided)
 * @param path - Translation path in format "namespace.key.subkey"
 * @returns Translated string or the path if translation not found
 */
export function t(lang: LanguageCode | undefined, path: string): string {
  // Validate path parameter
  if (!path || typeof path !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid path parameter: ${path}. Expected a string.`);
    }
    return typeof path === 'string' ? path : '';
  }

  // Use stored language if not provided
  if (!lang) {
    lang = getStoredLanguage();
  }

  // Validate path format
  const parts = path.split('.');
  if (parts.length < 2) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid translation path: "${path}". Expected format: "namespace.key"`);
    }
    return path;
  }

  const namespace = parts[0] as Namespace;
  const keys = parts.slice(1);

  // Check cache first (performance optimization)
  const cacheKey = `${lang}:${path}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Validate namespace
  const validNamespaces: Namespace[] = ['common', 'home', 'product', 'products', 'delivery', 'about', 'contact', 'faq', 'login', 'delivery-terms', 'terms', 'privacy', 'support', 'stores', 'returns', 'profile', 'checkout', 'register', 'categories', 'orders', 'admin', 'blog'];
  if (!validNamespaces.includes(namespace)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid namespace: "${namespace}". Valid namespaces: ${validNamespaces.join(', ')}`);
    }
    return path;
  }

  // Try to load translation for the requested language
  let translationObj = loadTranslation(lang, namespace);
  
  // Fallback to English if translation not found
  if (!translationObj && lang !== 'en') {
    translationObj = loadTranslation('en', namespace);
  }

  if (!translationObj) {
    return path;
  }

  // Navigate through nested keys
  let value = getNestedValue(translationObj, keys);

  // If value not found in requested language, try English fallback
  if (value === null && lang !== 'en') {
    const enTranslationObj = loadTranslation('en', namespace);
    if (enTranslationObj) {
      value = getNestedValue(enTranslationObj, keys);
    }
  }

  // Return result - can be string or array
  if (value === null || value === undefined) {
    return path;
  }
  
  // For arrays, return as-is (don't cache)
  if (Array.isArray(value)) {
    return value as any;
  }
  
  const result = typeof value === 'string' ? value : path;
  
  // Cache the result (limit cache size to prevent memory issues)
  if (translationCache.size < 1000) {
    translationCache.set(cacheKey, result);
  }
  
  return result;
}

/**
 * Get product text: getProductText(lang, productId, field)
 * Reads from products.json for the given language
 * 
 * Features:
 * - Automatic fallback to English
 * - Type-safe field validation
 * - Empty string fallback
 * 
 * @param lang - Language code (optional, uses stored language if not provided)
 * @param productId - Product ID (string)
 * @param field - Field name: 'title', 'shortDescription', or 'longDescription'
 * @returns Product text or empty string if not found
 */
export function getProductText(
  lang: LanguageCode | undefined,
  productId: string,
  field: ProductField
): string {
  // Use stored language if not provided
  if (!lang) {
    lang = getStoredLanguage();
  }

  // Validate productId
  if (!productId || typeof productId !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid productId: ${productId}`);
    }
    return '';
  }

  try {
    // Try to load products for the requested language
    let products = loadTranslation(lang, 'products');
    
    // Fallback to English if not found
    if ((!products || typeof products !== 'object') && lang !== 'en') {
      products = loadTranslation('en', 'products');
    }

    if (!products || typeof products !== 'object') {
      return '';
    }

    // Get product data
    const product = products[productId];
    if (!product || typeof product !== 'object') {
      // Try English fallback
      if (lang !== 'en') {
        const enProducts = loadTranslation('en', 'products');
        if (enProducts && typeof enProducts === 'object' && productId in enProducts) {
          const enProduct = enProducts[productId];
          if (enProduct && typeof enProduct === 'object' && field in enProduct) {
            const value = enProduct[field];
            return typeof value === 'string' ? value : '';
          }
        }
      }
      return '';
    }

    // Get field value
    if (field in product) {
      const value = product[field];
      if (typeof value === 'string') {
        return value;
      }
    }

    // Fallback to English
    if (lang !== 'en') {
      const enProducts = loadTranslation('en', 'products');
      if (enProducts && typeof enProducts === 'object' && productId in enProducts) {
        const enProduct = enProducts[productId];
        if (enProduct && typeof enProduct === 'object' && field in enProduct) {
          const value = enProduct[field];
          return typeof value === 'string' ? value : '';
        }
      }
    }

    return '';
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Failed to get product text: ${lang}/${productId}/${field}`, error);
    }
    return '';
  }
}


// Note: useTranslation hook has been moved to i18n-client.ts
// Import it from './i18n-client' in Client Components

/**
 * Clear translation cache (useful for development/hot reload)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get all available namespaces
 */
export function getAvailableNamespaces(): Namespace[] {
  return ['common', 'home', 'product', 'products', 'delivery', 'about', 'contact', 'faq', 'login', 'delivery-terms', 'terms', 'privacy', 'support', 'stores', 'returns', 'profile', 'checkout', 'register', 'categories', 'orders', 'admin', 'blog'];
}

/**
 * Get all available languages (only languages with translations)
 */
export function getAvailableLanguages(): LanguageCode[] {
  return ['en', 'hy', 'ru'] as LanguageCode[];
}
