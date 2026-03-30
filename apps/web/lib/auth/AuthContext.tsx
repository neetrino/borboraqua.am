'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '../api-client';

/**
 * User interface
 */
interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

/**
 * Auth Context interface
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  roles: string[];
  login: (_emailOrPhone: string, _password: string) => Promise<User>;
  register: (_data: RegisterData) => Promise<void>;
  logout: () => void;
}

/**
 * Register data interface
 */
interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Auth response from API
 */
interface AuthResponse {
  user: User;
  token?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'auth_user';

/**
 * Auth Provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load optimistic user from localStorage, then validate session by HttpOnly cookie.
  useEffect(() => {
    console.log('🔐 [AUTH] Loading auth state...');
    
    const loadAuthState = async () => {
      try {
        const storedUser = localStorage.getItem(AUTH_USER_KEY);
        const legacyToken = localStorage.getItem('auth_token');

        if (legacyToken) {
          localStorage.removeItem('auth_token');
        }

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem(AUTH_USER_KEY);
          }
        }

        try {
          const profileData = await apiClient.get<User>('/api/v1/users/profile', { skipAuth: true });
          setUser(profileData);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profileData));
          console.log('✅ [AUTH] Active cookie session restored');
        } catch {
          localStorage.removeItem(AUTH_USER_KEY);
          setUser(null);
          console.log('ℹ️ [AUTH] No active cookie session');
        }
      } catch (error) {
        console.error('❌ [AUTH] Error loading auth state:', error);
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  /**
   * Login user
   */
  const login = async (emailOrPhone: string, password: string) => {
    console.log('🔐 [AUTH] Login attempt:', { emailOrPhone: emailOrPhone ? 'provided' : 'not provided', password: password ? 'provided' : 'not provided' });
    
    try {
      setIsLoading(true);

      // Determine if it's email or phone
      const isEmail = emailOrPhone.includes('@');
      const requestData = isEmail
        ? { email: emailOrPhone, password }
        : { phone: emailOrPhone, password };

      console.log('📤 [AUTH] Sending login request to API...');
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', requestData, {
        skipAuth: true, // Don't send token for login
      });

      console.log('✅ [AUTH] Login successful:', { 
        userId: response.user.id,
        roles: response.user.roles,
        isAdmin: response.user.roles?.includes('admin')
      });

      // Persist user only; token is stored in HttpOnly cookie by API.
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
      setUser(response.user);

      // Trigger auth update event
      window.dispatchEvent(new Event('auth-updated'));

      // Return user data so login page can use it for redirect
      return response.user;
    } catch (error: any) {
      console.error('❌ [AUTH] Login error:', error);
      
      // Extract error message from API response
      let errorMessage = 'Login failed. Please try again.';
      
      // Check if it's an ApiError
      if (error instanceof ApiError) {
        if (error.status === 401) {
          errorMessage = error.message || 'Invalid email/phone or password';
        } else if (error.status === 403) {
          errorMessage = error.message || 'Your account has been blocked';
        } else if (error.status === 400) {
          errorMessage = error.message || 'Please provide email/phone and password';
        } else {
          errorMessage = error.message || errorMessage;
        }
      } else if (error.status === 401) {
        errorMessage = error.message || 'Invalid email/phone or password';
      } else if (error.status === 403) {
        errorMessage = error.message || 'Your account has been blocked';
      } else if (error.status === 400) {
        errorMessage = error.message || 'Please provide email/phone and password';
      } else if (error.message) {
        // Use the error message directly if available
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterData) => {
    console.log('🔐 [AUTH] Registration attempt:', { 
      email: data.email || 'not provided',
      phone: data.phone || 'not provided',
      hasFirstName: !!data.firstName,
      hasLastName: !!data.lastName
    });

    try {
      setIsLoading(true);

      console.log('📤 [AUTH] Sending registration request to API...', { data });
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', data, {
        skipAuth: true, // Don't send token for registration
      });

      console.log('✅ [AUTH] Registration response received');

      if (!response || !response.user) {
        console.error('❌ [AUTH] Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      console.log('✅ [AUTH] Registration successful:', { userId: response.user.id });

      // Persist user only; token is stored in HttpOnly cookie by API.
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
        console.log('💾 [AUTH] User data stored in localStorage');
      } catch (storageError) {
        console.error('❌ [AUTH] Failed to store auth data:', storageError);
        throw new Error('Failed to save authentication data');
      }

      setUser(response.user);

      // Trigger auth update event
      window.dispatchEvent(new Event('auth-updated'));

      console.log('🔄 [AUTH] Redirecting to home page...');
      // Redirect to home page
      router.push('/');
    } catch (error: any) {
      console.error('❌ [AUTH] Registration error:', error);
      console.error('❌ [AUTH] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Extract error message from API response
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message) {
        // Check if error has structured data
        if ((error as any).data && (error as any).data.detail) {
          errorMessage = (error as any).data.detail;
        } else if ((error as any).data && (error as any).data.message) {
          errorMessage = (error as any).data.message;
        } else {
          // Fallback to parsing error message
          const errorText = error.message;
          if (errorText.includes('409') || errorText.includes('already exists') || errorText.includes('User already exists')) {
            errorMessage = 'User with this email or phone already exists';
          } else if (errorText.includes('400') || errorText.includes('Validation failed')) {
            if (errorText.includes('password') || errorText.includes('Password')) {
              errorMessage = 'Password must be at least 6 characters';
            } else if (errorText.includes('email') || errorText.includes('phone')) {
              errorMessage = 'Please provide email or phone and password';
            } else {
              errorMessage = 'Invalid registration data. Please check your input.';
            }
          } else if (errorText.includes('500') || errorText.includes('Internal Server Error')) {
            errorMessage = 'Server error. Please try again later.';
          } else if (errorText.includes('Failed to parse')) {
            errorMessage = 'Invalid response from server. Please try again.';
          } else {
            // Try to extract meaningful message
            const match = errorText.match(/detail[:\s]+([^,\n]+)/i);
            if (match) {
              errorMessage = match[1].trim();
            }
          }
        }
      }

      console.error('❌ [AUTH] Final error message:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user — invalidate token on server (2.7), then clear local state
   */
  const logout = () => {
    console.log('🔐 [AUTH] Logging out...');
    // Invalidate server-side cookie session.
    if (typeof window !== 'undefined') {
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      const url = base ? `${base}/api/v1/auth/logout` : '/api/v1/auth/logout';
      fetch(url, { method: 'POST', credentials: 'include' }).catch(() => {});
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
    window.dispatchEvent(new Event('auth-updated'));
    router.push('/');
  };

  // Calculate roles and admin status
  const roles = user && Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = roles.includes('admin');
  
  // Debug logging and ensure roles are loaded
  useEffect(() => {
    if (user) {
      const userRoles = Array.isArray(user.roles) ? user.roles : [];
      const userIsAdmin = userRoles.includes('admin');
      
      console.log('🔍 [AUTH] User state updated:', {
        userId: user.id,
        roles: user.roles,
        rolesArray: userRoles,
        isAdmin: userIsAdmin,
        rolesType: typeof user.roles,
        rolesIsArray: Array.isArray(user.roles)
      });
      
      // If user doesn't have roles, fetch from API
      if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
        console.log('⚠️ [AUTH] User missing roles, fetching from API...');
        apiClient.get<{ roles: string[] }>('/api/v1/users/profile')
          .then(profileData => {
            if (profileData.roles && Array.isArray(profileData.roles)) {
              const updatedUser = { ...user, roles: profileData.roles };
              setUser(updatedUser);
              localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
              console.log('✅ [AUTH] Roles updated from API:', profileData.roles);
            }
          })
          .catch(error => {
            console.error('❌ [AUTH] Failed to fetch user roles:', error);
          });
      }
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    token: null,
    isLoggedIn: !!user,
    isLoading,
    isAdmin,
    roles,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Default auth context value (used when context is undefined, e.g., during SSR)
 */
const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  isLoggedIn: false,
  isLoading: true,
  isAdmin: false,
  roles: [],
  login: async () => {
    throw new Error('AuthProvider not initialized');
  },
  register: async () => {
    throw new Error('AuthProvider not initialized');
  },
  logout: () => {
    throw new Error('AuthProvider not initialized');
  },
};

/**
 * Hook to use auth context
 * Returns default values during SSR to prevent hydration errors
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  // During SSR or when context is undefined, return default values
  // This prevents "useAuth must be used within an AuthProvider" errors
  // during server-side rendering
  if (context === undefined) {
    // Only throw in development if we're on the client side
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('useAuth called outside AuthProvider, using default values');
    }
    return defaultAuthContext;
  }
  
  return context;
}

