'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';
import { apiClient } from '../../lib/api-client';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t('forgotPassword.errors.emailRequired'));
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/api/v1/auth/forgot-password', { email: trimmed }, { skipAuth: true });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : t('forgotPassword.errors.requestFailed');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
        <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-5 md:p-6 sm:p-4 border border-[rgba(255,255,255,0)] overflow-clip">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('forgotPassword.title')}</h1>
          <p className="text-gray-600 mb-6">{t('forgotPassword.subtitle')}</p>

          {success ? (
            <div className="mb-4 p-3 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-[12px]">
              <p className="text-sm text-green-700">{t('forgotPassword.successMessage')}</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-[12px]">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('forgotPassword.form.email')}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder={t('forgotPassword.form.emailPlaceholder')}
                    className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-gray-900 placeholder:text-gray-500 transition-all disabled:opacity-50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-6 bg-gradient-to-r from-[#00D1FF] to-[#1AC0FD] rounded-[12px] text-white font-semibold text-base shadow-lg hover:shadow-xl hover:from-[#00B8E6] hover:to-[#00A8D6] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('forgotPassword.form.submitting') : t('forgotPassword.form.submit')}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline font-medium">
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
