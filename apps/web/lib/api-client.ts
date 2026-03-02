/**
 * API Client
 * 
 * Client for making requests to the backend API
 * 
 * In Next.js, when API routes are in the same app, we use relative paths.
 * If NEXT_PUBLIC_API_URL is set, use it (for external API).
 * Otherwise, use empty string to make relative requests to Next.js API routes.
 */

import { logger } from './logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const AUTH_TOKEN_KEY = 'auth_token';

interface RequestOptions extends globalThis.RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean; // Skip automatic token injection
}

/**
 * Custom API Error class with proper typing
 */
export class ApiError extends Error {
  status: number;
  statusText: string;
  data?: any;

  constructor(message: string, status: number, statusText: string = '', data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // If baseUrl is empty (relative paths for Next.js API routes)
    if (!this.baseUrl || this.baseUrl.trim() === '') {
      // Check if we're on the server (Node.js environment)
      const isServer = typeof window === 'undefined';
      
      // On server, we need an absolute URL
      if (isServer) {
        // Try to get the base URL from environment variable or construct it
        let serverUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!serverUrl) {
          if (process.env.VERCEL_URL) {
            serverUrl = `https://${process.env.VERCEL_URL}`;
          } else {
            serverUrl = 'http://localhost:3000';
          }
        }
        
        let url = `${serverUrl}${normalizedEndpoint}`;
        if (params && Object.keys(params).length > 0) {
          const searchParams = Object.entries(params)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');
          url = `${url}${url.includes('?') ? '&' : '?'}${searchParams}`;
        }
        return url;
      }
      
      // On client, use relative URL
      let url = normalizedEndpoint;
      if (params && Object.keys(params).length > 0) {
        const searchParams = Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&');
        url = `${url}${url.includes('?') ? '&' : '?'}${searchParams}`;
      }
      return url;
    }
    
    // Build base URL for absolute URLs
    let baseUrl = this.baseUrl;
    if (!baseUrl.endsWith('/')) {
      baseUrl = baseUrl.replace(/\/+$/, '');
    }
    
    // Combine base URL and endpoint
    const fullUrl = `${baseUrl}${normalizedEndpoint}`;
    
    // Use URL constructor for proper URL handling
    try {
      const url = new URL(fullUrl);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      
      return url.toString();
    } catch (error) {
      // Fallback: manual URL construction if URL constructor fails
      logger.error('❌ [API CLIENT] URL construction error:', error, { baseUrl, endpoint, fullUrl });
      
      let url = fullUrl;
      if (params && Object.keys(params).length > 0) {
        const searchParams = Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&');
        url = `${url}${url.includes('?') ? '&' : '?'}${searchParams}`;
      }
      
      return url;
    }
  }

  /**
   * Get headers with automatic token injection
   */
  private getHeaders(options?: RequestOptions): globalThis.HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    // Add auth token if available and not skipped
    if (!options?.skipAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        logger.log('🔑 [API CLIENT] Token added to request headers', {
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...',
        });
      } else {
        logger.warn('⚠️ [API CLIENT] No token found in localStorage for authenticated request');
      }
    } else {
      logger.log('🔓 [API CLIENT] Auth skipped for this request');
    }

    return headers as globalThis.HeadersInit;
  }

  /**
   * Check if error should be logged (skip 401 and 404 errors)
   * 401 - authentication errors are expected
   * 404 - resource not found is expected (e.g., product doesn't exist)
   */
  private shouldLogError(status: number): boolean {
    return status !== 401 && status !== 404;
  }

  /**
   * Check if error should be logged as warning (404 Not Found)
   */
  private shouldLogWarning(status: number): boolean {
    return status === 404;
  }

  /**
   * Handle 401 Unauthorized errors - clear auth and redirect
   */
  private handleUnauthorized() {
    if (typeof window === 'undefined') return;
    
    logger.warn('⚠️ [API CLIENT] Unauthorized (401) - clearing auth data');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // Trigger auth update event to notify AuthContext
    window.dispatchEvent(new Event('auth-updated'));
    
    // Redirect to login if not already there
    if (!window.location.pathname.includes('/login')) {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions, retryCount = 0): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    // Reduced timeout for faster failure - 10 seconds for product details, 15 seconds for other requests
    const timeout = endpoint.includes('/products/') ? 10000 : 15000;
    
    // Debug: Check token before request
    const token = getAuthToken();
    logger.log('🌐 [API CLIENT] GET request:', { 
      url, 
      endpoint, 
      baseUrl: this.baseUrl,
      hasToken: !!token,
      tokenLength: token?.length,
      skipAuth: options?.skipAuth,
    });
    
    let response: Response;
    try {
      // Ստեղծում ենք timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(options),
          cache: 'no-store', // Disable caching for server components
          signal: controller.signal,
          ...options,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(`Request timeout: API server did not respond within ${timeout / 1000} seconds. URL: ${url}`);
        }
        throw fetchError;
      }
      
      // Լոգավորում ենք response status-ը անվտանգ կերպով
      try {
        logger.log('🌐 [API CLIENT] GET response status:', response.status, response.statusText || '');
      } catch (logError) {
        // Եթե console.log-ը ձախողվի, շարունակում ենք
        logger.warn('⚠️ [API CLIENT] Failed to log response status');
      }
    } catch (networkError: any) {
      // Ստուգում ենք timeout սխալը
      if (networkError.message?.includes('timeout') || networkError.message?.includes('Request timeout')) {
        logger.error('⏱️ [API CLIENT] Request timeout:', networkError.message);
        throw networkError;
      }
      
      logger.error('❌ [API CLIENT] Network error during fetch:', networkError);
      
      // Ստուգում ենք, արդյոք սա կապի մերժման սխալ է
      const isConnectionRefused = networkError.message?.includes('Failed to fetch') || 
                                  networkError.message?.includes('ERR_CONNECTION_REFUSED') ||
                                  networkError.message?.includes('NetworkError') ||
                                  networkError.message?.includes('Network request failed');
      
      if (isConnectionRefused) {
        const errorMessage = this.baseUrl 
          ? `⚠️ API սերվերը հասանելի չէ!\n\n` +
            `Չհաջողվեց միանալ ${this.baseUrl}\n\n` +
            `Լուծում:\n` +
            `1. Համոզվեք, որ API սերվերը գործարկված է\n` +
            `2. Ստուգեք, որ ${this.baseUrl.split(':').pop() || 'port'} պորտը զբաղված չէ այլ գործընթացով\n\n` +
            `Հարցման URL: ${url}`
          : `⚠️ API route-ը հասանելի չէ!\n\n` +
            `Չհաջողվեց միանալ Next.js API route-ին: ${url}\n\n` +
            `Լուծում:\n` +
            `1. Համոզվեք, որ Next.js dev server-ը գործարկված է (npm run dev)\n` +
            `2. Ստուգեք, որ API route-ը գոյություն ունի: ${url}\n\n`;
        
        logger.error('❌ [API CLIENT]', errorMessage);
        throw new Error(errorMessage);
      }
      
      throw new Error(`Ցանցային սխալ: Չհաջողվեց միանալ API-ին ${url}. ${networkError.message || 'Խնդրում ենք ստուգել, արդյոք Next.js server-ը գործարկված է:'}`);
    }

    if (!response.ok) {
      // Retry on 429 (Too Many Requests) errors
      if (response.status === 429 && retryCount < maxRetries) {
        const delay = retryDelay * (retryCount + 1); // Exponential backoff
        logger.warn(`⚠️ [API CLIENT] Rate limited, retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.get<T>(endpoint, options, retryCount + 1);
      }

      let errorText = '';
      let errorData: any = null;
      const isUnauthorized = response.status === 401;
      const isNotFound = response.status === 404;
      
      // Log 404 as warning (expected situation - resource doesn't exist)
      if (this.shouldLogWarning(response.status)) {
        logger.warn(`⚠️ [API CLIENT] GET Not Found (404): ${url}`);
      }
      // Log other errors (except 401 which is expected)
      else if (this.shouldLogError(response.status)) {
        logger.error(`❌ [API CLIENT] GET Error: ${response.status} ${response.statusText}`, {
          url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });
      }
      
      try {
        const text = await response.text();
        errorText = text || '';
        
        // Try to parse as JSON
        if (errorText && errorText.trim().startsWith('{')) {
          try {
            errorData = JSON.parse(errorText);
            // Log 404 as warning, other errors (except 401) as error
            if (isNotFound) {
              logger.warn('⚠️ [API CLIENT] GET Not Found response:', errorData);
            } else if (!isUnauthorized) {
              logger.error('❌ [API CLIENT] GET Error response (JSON):', errorData);
            }
          } catch (parseErr) {
            // If JSON parse fails, use text as is
            if (isNotFound) {
              logger.warn('⚠️ [API CLIENT] GET Not Found response (text):', errorText);
            } else if (!isUnauthorized) {
              logger.error('❌ [API CLIENT] GET Error response (text):', errorText);
            }
          }
        } else if (errorText) {
          if (isNotFound) {
            logger.warn('⚠️ [API CLIENT] GET Not Found response (text):', errorText);
          } else if (!isUnauthorized) {
            logger.error('❌ [API CLIENT] GET Error response (text):', errorText);
          }
        }
      } catch (e) {
        if (isNotFound) {
          logger.warn('⚠️ [API CLIENT] Failed to read 404 response:', e);
        } else if (!isUnauthorized) {
          logger.error('❌ [API CLIENT] Failed to read error response:', e);
        }
      }
      
      // Handle 401 Unauthorized - clear token and redirect
      if (isUnauthorized) {
        this.handleUnauthorized();
      }
      
      // Handle 403 Forbidden - might be due to invalid token signature
      // Check server logs for "invalid signature" - if so, clear token
      if (response.status === 403 && endpoint.includes('/admin/')) {
        // For admin endpoints, 403 usually means invalid token or not admin
        // If we have a token but getting 403, it might be invalid signature
        const token = getAuthToken();
        if (token) {
          logger.warn('⚠️ [API CLIENT] 403 Forbidden with token present - token might be invalid (wrong JWT_SECRET). Please log out and log back in.');
          // Don't auto-clear for 403 as it might be legitimate (not admin), but log warning
        }
      }
      
      // Create a more detailed error with safe fallbacks
      const errorMessage = errorData?.detail || errorData?.message || (errorText ? String(errorText) : '') || `API Error: ${response.status} ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, response.statusText || '', errorData);
    }

    try {
      if (!response) {
        throw new Error('Response is undefined');
      }

      const contentType = response.headers?.get('content-type');
      logger.log('🌐 [API CLIENT] Response content-type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        logger.error('❌ [API CLIENT] GET Non-JSON response:', {
          contentType,
          status: response.status,
          text: text?.substring(0, 200) || '', // First 200 chars
        });
        throw new Error(`Expected JSON response but got ${contentType}. Status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      logger.log('✅ [API CLIENT] GET Response parsed successfully');
      
      if (!jsonData) {
        logger.warn('⚠️ [API CLIENT] Response data is null or undefined');
        return null as T;
      }
      
      return jsonData;
    } catch (parseError: any) {
      logger.error('❌ [API CLIENT] GET JSON parse error:', parseError);
      logger.error('❌ [API CLIENT] Parse error stack:', parseError.stack);
      if (parseError.message && parseError.message.includes('Expected JSON')) {
        throw parseError;
      }
      throw new Error(`Failed to parse response as JSON: ${parseError.message || String(parseError)}`);
    }
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    try {
      const url = this.buildUrl(endpoint, options?.params);
      
      logger.log('📤 [API CLIENT] POST request:', { url, data: data ? 'provided' : 'none' });
      
      // Add timeout for POST requests - 10 seconds for cart operations, 15 seconds for others
      const timeout = endpoint.includes('/cart/') ? 10000 : 15000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(options),
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
          ...options,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(`Request timeout: API server did not respond within ${timeout / 1000} seconds. URL: ${url}`);
        }
        throw fetchError;
      }

      logger.log('📥 [API CLIENT] Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorText = '';
        let errorData: any = null;
        const isUnauthorized = response.status === 401;
        
        // Handle 401 Unauthorized - clear token and redirect
        if (isUnauthorized) {
          this.handleUnauthorized();
        }
        
        try {
          const text = await response.text();
          errorText = text || '';
          
          // Try to parse as JSON
          if (errorText && errorText.trim().startsWith('{')) {
            try {
              errorData = JSON.parse(errorText);
              if (this.shouldLogError(response.status)) {
                logger.error('❌ [API CLIENT] POST Error response (JSON):', errorData);
              }
            } catch (parseErr) {
              // If JSON parse fails, use text as is
              if (this.shouldLogError(response.status)) {
                logger.error('❌ [API CLIENT] POST Error response (text):', errorText);
              }
            }
          } else if (errorText && this.shouldLogError(response.status)) {
            logger.error('❌ [API CLIENT] POST Error response (text):', errorText);
          }
        } catch (e) {
          if (this.shouldLogError(response.status)) {
            logger.error('❌ [API CLIENT] Failed to read error response:', e);
          }
        }
        
        // Create a more detailed error with safe fallbacks
        const errorMessage = errorData?.detail || errorData?.message || (errorText ? String(errorText) : '') || `API Error: ${response.status} ${response.statusText}`;
        throw new ApiError(errorMessage, response.status, response.statusText || '', errorData);
      }

      try {
        const jsonData = await response.json();
        logger.log('✅ [API CLIENT] Response parsed successfully');
        return jsonData;
      } catch (parseError) {
        logger.error('❌ [API CLIENT] JSON parse error:', parseError);
        throw new Error(`Failed to parse response: ${parseError}`);
      }
    } catch (error: any) {
      // Handle network errors, URL construction errors, etc.
      if (error instanceof TypeError && error.message.includes('fetch')) {
        logger.error('❌ [API CLIENT] Network error:', error);
        const errorMsg = this.baseUrl
          ? `Network error: Unable to connect to API. Please check if the API server is running at ${this.baseUrl}`
          : `Network error: Unable to connect to Next.js API routes. Please check if the Next.js server is running.`;
        throw new Error(errorMsg);
      }
      
      // Re-throw if it's already our custom ApiError
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Re-throw if it's a parse error
      if (error.message && error.message.includes('Failed to parse')) {
        throw error;
      }
      
      // Otherwise wrap in a generic error
      logger.error('❌ [API CLIENT] POST request failed:', error);
      throw new Error(`API request failed: ${error.message || String(error)}`);
    }
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    
    logger.log('📤 [API CLIENT] PUT request:', { url, endpoint, hasData: !!data });
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(options),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    logger.log('📥 [API CLIENT] PUT response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorText = '';
      let errorData: any = null;
      const isUnauthorized = response.status === 401;
      const isNotFound = response.status === 404;
      
      // Log 404 as warning (expected situation - resource doesn't exist)
      if (this.shouldLogWarning(response.status)) {
        logger.warn(`⚠️ [API CLIENT] PUT Not Found (404): ${url}`);
      }
      // Log other errors (except 401 which is expected)
      else if (this.shouldLogError(response.status)) {
        logger.error(`❌ [API CLIENT] PUT Error: ${response.status} ${response.statusText}`, {
          url,
          status: response.status,
          statusText: response.statusText,
        });
      }
      
      // Handle 401 Unauthorized - clear token and redirect
      if (isUnauthorized) {
        this.handleUnauthorized();
      }
      
      try {
        const text = await response.text();
        errorText = text || '';
        
        // Try to parse as JSON
        if (errorText && errorText.trim().startsWith('{')) {
          try {
            errorData = JSON.parse(errorText);
            // Log 404 as warning, other errors (except 401) as error
            if (isNotFound) {
              logger.warn('⚠️ [API CLIENT] PUT Not Found response:', errorData);
            } else if (!isUnauthorized) {
              logger.error('❌ [API CLIENT] PUT Error response (JSON):', {
                url,
                status: response.status,
                statusText: response.statusText,
                error: {
                  type: errorData?.type,
                  title: errorData?.title,
                  detail: errorData?.detail,
                  message: errorData?.message,
                  status: errorData?.status,
                  instance: errorData?.instance,
                  fullError: errorData,
                },
              });
            }
          } catch (parseErr) {
            // If JSON parse fails, use text as is
            if (isNotFound) {
              logger.warn('⚠️ [API CLIENT] PUT Not Found response (text):', errorText);
            } else if (!isUnauthorized) {
              logger.error('❌ [API CLIENT] PUT Error response (text):', {
                url,
                status: response.status,
                statusText: response.statusText,
                errorText,
              });
            }
          }
        } else if (errorText) {
          if (isNotFound) {
            logger.warn('⚠️ [API CLIENT] PUT Not Found response (text):', errorText);
          } else if (!isUnauthorized) {
            logger.error('❌ [API CLIENT] PUT Error response (text):', {
              url,
              status: response.status,
              statusText: response.statusText,
              errorText,
            });
          }
        }
      } catch (e) {
        if (isNotFound) {
          logger.warn('⚠️ [API CLIENT] Failed to read 404 response:', e);
        } else if (!isUnauthorized) {
          logger.error('❌ [API CLIENT] Failed to read error response:', {
            url,
            status: response.status,
            error: e,
          });
        }
      }
      
      // Create a more detailed error with safe fallbacks
      const errorMessage = errorData?.detail || errorData?.message || (errorText ? String(errorText) : '') || `API Error: ${response.status} ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, response.statusText || '', errorData);
    }

    try {
      const jsonData = await response.json();
      logger.log('✅ [API CLIENT] PUT Response parsed successfully');
      return jsonData;
    } catch (parseError) {
      logger.error('❌ [API CLIENT] PUT JSON parse error:', {
        url,
        status: response.status,
        error: parseError,
      });
      throw new Error(`Failed to parse response: ${parseError}`);
    }
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(options),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      let errorText = '';
      let errorData: any = null;
      
      try {
        const text = await response.text();
        errorText = text || '';
        
        // Try to parse as JSON
        if (errorText && errorText.trim().startsWith('{')) {
          try {
            errorData = JSON.parse(errorText);
            if (this.shouldLogError(response.status)) {
              logger.error('❌ [API CLIENT] PATCH Error response (JSON):', errorData);
            }
          } catch (parseErr) {
            // If JSON parse fails, use text as is
            if (this.shouldLogError(response.status)) {
              logger.error('❌ [API CLIENT] PATCH Error response (text):', errorText);
            }
          }
        } else if (errorText && this.shouldLogError(response.status)) {
          logger.error('❌ [API CLIENT] PATCH Error response (text):', errorText);
        }
      } catch (e) {
        if (this.shouldLogError(response.status)) {
          logger.error('❌ [API CLIENT] Failed to read error response:', e);
        }
      }
      
      // Create a more detailed error with safe fallbacks
      const errorMessage = errorData?.detail || errorData?.message || (errorText ? String(errorText) : '') || `API Error: ${response.status} ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, response.statusText || '', errorData);
    }

    try {
      return await response.json();
    } catch (parseError) {
      logger.error('❌ [API CLIENT] PATCH JSON parse error:', parseError);
      throw new Error(`Failed to parse response: ${parseError}`);
    }
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(options),
      ...options,
    });

    if (!response.ok) {
      let errorText = '';
      let errorData: any = null;
      
      try {
        const text = await response.text();
        errorText = text || '';
        
        // Try to parse as JSON
        if (errorText && errorText.trim().startsWith('{')) {
          try {
            errorData = JSON.parse(errorText);
            if (this.shouldLogError(response.status)) {
              logger.error('❌ [API CLIENT] DELETE Error response:', {
                status: response.status,
                statusText: response.statusText,
                url: url,
                error: {
                  type: errorData?.type,
                  title: errorData?.title,
                  status: errorData?.status,
                  detail: errorData?.detail,
                  message: errorData?.message,
                  instance: errorData?.instance,
                  fullData: errorData,
                },
                rawText: errorText,
              });
            }
          } catch (parseErr) {
            // If JSON parse fails, use text as is
            if (this.shouldLogError(response.status)) {
              logger.error('❌ [API CLIENT] DELETE Error response (text, parse failed):', {
                status: response.status,
                statusText: response.statusText,
                url: url,
                errorText: errorText,
                parseError: parseErr,
              });
            }
          }
        } else if (errorText && this.shouldLogError(response.status)) {
          logger.error('❌ [API CLIENT] DELETE Error response (text):', {
            status: response.status,
            statusText: response.statusText,
            url: url,
            errorText: errorText,
          });
        } else if (this.shouldLogError(response.status)) {
          logger.error('❌ [API CLIENT] DELETE Error response (no body):', {
            status: response.status,
            statusText: response.statusText,
            url: url,
          });
        }
      } catch (e) {
        if (this.shouldLogError(response.status)) {
          logger.error('❌ [API CLIENT] Failed to read error response:', {
            status: response.status,
            statusText: response.statusText,
            url: url,
            error: e,
          });
        }
      }
      
      // Create a more detailed error with safe fallbacks
      const errorMessage = errorData?.detail || errorData?.message || (errorText ? String(errorText) : '') || `API Error: ${response.status} ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, response.statusText || '', errorData);
    }

    // DELETE requests might not return a body
    try {
      const text = await response.text();
      if (text) {
        return JSON.parse(text);
      }
      return null as T;
    } catch (parseError) {
      // If there's no body or parse fails, return null for DELETE
      return null as T;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

