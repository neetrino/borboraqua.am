'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n-client';
import { apiClient } from '../../lib/api-client';

function ResetPasswordContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams?.get('token') ?? '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [checkingToken, setCheckingToken] = useState(!!tokenFromUrl.trim());

  useEffect(() => {
    setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  useEffect(() => {
    const raw = tokenFromUrl.trim();
    if (!raw) {
      setCheckingToken(false);
      setTokenValid(null);
      return;
    }
    let cancelled = false;
    setCheckingToken(true);
    apiClient
      .get<{ valid: boolean }>(`/api/v1/auth/validate-reset-token?token=${encodeURIComponent(raw)}`, { skipAuth: true })
      .then((res) => {
        if (!cancelled) {
          setTokenValid(res.valid);
        }
      })
      .catch(() => {
        if (!cancelled) setTokenValid(false);
      })
      .finally(() => {
        if (!cancelled) setCheckingToken(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tokenFromUrl]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!token.trim()) {
      setError(t('resetPassword.errors.tokenRequired'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('resetPassword.errors.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.errors.passwordsDoNotMatch'));
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post(
        '/api/v1/auth/reset-password',
        { token: token.trim(), newPassword },
        { skipAuth: true }
      );
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'data' in err ? (err as { data?: { detail?: string } }).data : undefined;
      const message = data?.detail ?? (err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : t('resetPassword.errors.resetFailed'));
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingToken && tokenFromUrl.trim()) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
          <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200/60 rounded w-2/3" />
              <div className="h-4 bg-gray-200/60 rounded w-full" />
              <div className="h-10 bg-gray-200/60 rounded-[12px]" />
              <div className="h-10 bg-gray-200/60 rounded-[12px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tokenFromUrl.trim() && tokenValid === false) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
          <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('resetPassword.linkExpiredTitle')}</h1>
            <p className="text-gray-600 mb-6">{t('resetPassword.linkExpiredMessage')}</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/forgot-password"
                className="inline-flex justify-center py-2.5 px-6 bg-gradient-to-r from-[#00D1FF] to-[#1AC0FD] rounded-[12px] text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {t('resetPassword.requestNewLink')}
              </Link>
              <Link href="/login" className="text-center text-sm text-blue-600 hover:underline font-medium">
                {t('resetPassword.backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
          <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
            <div className="mb-4 p-3 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-[12px]">
              <p className="text-sm text-green-700">{t('resetPassword.successMessage')}</p>
            </div>
            <p className="text-sm text-gray-600">{t('resetPassword.redirecting')}</p>
            <Link href="/login" className="mt-4 inline-block text-sm text-blue-600 hover:underline font-medium">
              {t('resetPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
        <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('resetPassword.title')}</h1>
          <p className="text-gray-600 mb-6">{t('resetPassword.subtitle')}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-[12px]">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('resetPassword.form.newPassword')}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('resetPassword.form.newPasswordPlaceholder')}
                  className="w-full px-4 py-2 pr-10 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-gray-900 placeholder:text-gray-500 transition-all disabled:opacity-50"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-6.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8S1 12 1 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('resetPassword.form.confirmPassword')}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('resetPassword.form.confirmPasswordPlaceholder')}
                className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-gray-900 placeholder:text-gray-500 transition-all disabled:opacity-50"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-6 bg-gradient-to-r from-[#00D1FF] to-[#1AC0FD] rounded-[12px] text-white font-semibold text-base shadow-lg hover:shadow-xl hover:from-[#00B8E6] hover:to-[#00A8D6] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('resetPassword.form.submitting') : t('resetPassword.form.submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline font-medium">
              {t('resetPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded-[12px]" />
              <div className="h-10 bg-gray-200 rounded-[12px]" />
              <div className="h-10 bg-gray-200 rounded-[12px]" />
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
