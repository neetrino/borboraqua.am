'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const orderNumber = searchParams?.get('order') || '';
  const successWithNumber = t('checkout.status.successWithNumber').replace('{orderNumber}', orderNumber);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
        
        {/* Form Container with Glassmorphism */}
        <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-8 md:p-10 sm:p-6 border border-[rgba(255,255,255,0)] overflow-clip text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100/80 backdrop-blur-sm border border-green-200/50">
            <svg
              className="h-10 w-10 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {t('checkout.status.successTitle')}
          </h1>
          <p className="text-gray-600 mb-6">
            {orderNumber ? successWithNumber : t('checkout.status.successMessage')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/products')}
              className="w-full sm:w-auto py-2.5 px-6 bg-gradient-to-r from-[#00D1FF] to-[#1AC0FD] rounded-[12px] text-white font-semibold text-base shadow-lg hover:shadow-xl hover:from-[#00B8E6] hover:to-[#00A8D6] transition-all duration-300"
            >
              {t('checkout.status.backToShop')}
            </button>
            <button
              onClick={() => {
                if (orderNumber) {
                  router.push(`/orders/${encodeURIComponent(orderNumber)}`);
                } else {
                  router.push('/');
                }
              }}
              className="w-full sm:w-auto py-2.5 px-6 bg-white/50 backdrop-blur-md rounded-[12px] border border-white/30 text-gray-900 font-semibold text-base shadow-inner hover:bg-white/60 transition-all duration-300"
            >
              {t('checkout.status.backToOrder')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E82E] to-[#62B3E82E] rounded-[34px] -z-10" />
          <div className="bg-[rgba(135, 135, 135, 0.05)] backdrop-blur-[5px] rounded-[34px] p-8 md:p-10 sm:p-6 border border-[rgba(255,255,255,0)] overflow-clip text-center">
            <div className="animate-pulse">
              <div className="h-16 w-16 mx-auto mb-6 bg-gray-200 rounded-full"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}


