'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { ProductPageButton } from '../../../components/icons/global/globalMobile';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const orderNumber = searchParams?.get('order') || '';
  const successWithNumber = t('checkout.status.successWithNumber').replace('{orderNumber}', orderNumber);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
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
          <ProductPageButton
            variant="primary"
            className="w-full sm:w-auto py-3"
            onClick={() => router.push('/products')}
          >
            {t('checkout.status.backToShop')}
          </ProductPageButton>
          <ProductPageButton
            variant="outline"
            className="w-full sm:w-auto py-3"
            onClick={() => {
              if (orderNumber) {
                router.push(`/orders/${encodeURIComponent(orderNumber)}`);
              } else {
                router.push('/');
              }
            }}
          >
            {t('checkout.status.backToOrder')}
          </ProductPageButton>
        </div>
      </Card>
    </div>
  );
}


