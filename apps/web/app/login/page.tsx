'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n-client';

function LoginPageContent() {
  const { t } = useTranslation();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  const { login, isLoading, isLoggedIn, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    console.log('🔐 [LOGIN PAGE] Form submitted');

    // Validation
    if (!emailOrPhone.trim()) {
      setError(t('login.errors.emailOrPhoneRequired'));
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      setError(t('login.errors.passwordRequired'));
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('📤 [LOGIN PAGE] Calling login function...');
      const loggedInUser = await login(emailOrPhone.trim(), password);
      
      // Check user role from login response
      const userIsAdmin = loggedInUser?.roles?.includes('admin') || false;
      
      // Determine redirect based on user role
      const redirectParam = searchParams?.get('redirect');
      const finalRedirect = redirectParam || (userIsAdmin ? '/admin' : '/profile');
      console.log('✅ [LOGIN PAGE] Login successful, redirecting to:', finalRedirect, { isAdmin: userIsAdmin, roles: loggedInUser?.roles });
      setHasRedirected(true);
      router.push(finalRedirect);
    } catch (err: any) {
      console.error('❌ [LOGIN PAGE] Login error:', err);
      setError(err.message || t('login.errors.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if already logged in (but not if we just redirected from handleSubmit)
  useEffect(() => {
    if (isLoggedIn && !isLoading && !hasRedirected) {
      const finalRedirect = searchParams?.get('redirect') || (isAdmin ? '/admin' : '/profile');
      console.log('✅ [LOGIN PAGE] Already logged in, redirecting to:', finalRedirect);
      router.push(finalRedirect);
    }
  }, [isLoggedIn, isLoading, isAdmin, searchParams, router, hasRedirected]);

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
        
        {/* Form Container with Glassmorphism */}
        <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('login.title')}</h1>
          <p className="text-gray-600 mb-6">{t('login.subtitle')}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-[12px]">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('login.form.emailOrPhone')}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="emailOrPhone"
                type="text"
                placeholder={t('login.form.emailOrPhonePlaceholder')}
                className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-gray-900 placeholder:text-gray-500 transition-all disabled:opacity-50"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                disabled={isSubmitting || isLoading}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('login.form.password')}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login.form.passwordPlaceholder')}
                  className="w-full px-4 py-2 pr-10 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-gray-900 placeholder:text-gray-500 transition-all disabled:opacity-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-6.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8S1 12 1 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting || isLoading}
                />
                <span className="ml-2 text-sm text-gray-600">{t('login.form.rememberMe')}</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                {t('login.form.forgotPassword')}
              </Link>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-2.5 px-6 bg-gradient-to-r from-[#00D1FF] to-[#1AC0FD] rounded-[12px] text-white font-semibold text-base shadow-lg hover:shadow-xl hover:from-[#00B8E6] hover:to-[#00A8D6] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? t('login.form.submitting') : t('login.form.submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('login.form.noAccount')}{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                {t('login.form.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
          <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded-[12px]"></div>
                <div className="h-10 bg-gray-200 rounded-[12px]"></div>
                <div className="h-10 bg-gray-200 rounded-[12px]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

