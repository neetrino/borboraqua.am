'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { ProductPageButton } from '../../../components/icons/global/globalMobile';

export default function CheckoutErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const messageFromQuery = searchParams?.get('message') || '';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-10 w-10 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {t('checkout.status.errorTitle')}
        </h1>
        <p className="text-gray-600 mb-4">
          {t('checkout.status.errorMessage')}
        </p>
        {messageFromQuery && (
          <p className="text-sm text-red-600 mb-6 break-words">
            {messageFromQuery}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <ProductPageButton
            variant="primary"
            className="w-full sm:w-auto py-3"
            onClick={() => router.push('/checkout')}
          >
            {t('checkout.status.tryAgain')}
          </ProductPageButton>
          <ProductPageButton
            variant="outline"
            className="w-full sm:w-auto py-3"
            onClick={() => router.push('/products')}
          >
            {t('checkout.status.backToShop')}
          </ProductPageButton>
        </div>
      </Card>
    </div>
  );
}


