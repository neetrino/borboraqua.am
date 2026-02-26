'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';

/**
 * Delivery Terms page - describes shipping and delivery conditions
 */
export default function DeliveryTermsPage() {
  const { t } = useTranslation();
  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <h1 className="text-4xl font-bold text-gray-900">{t('delivery-terms.title')}</h1>
        <p className="text-gray-600">
          {t('delivery-terms.lastUpdated')}{' '}
          {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="mt-8 space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <p className="text-gray-600">{t('delivery-terms.intro.line1')}</p>
              <p className="text-gray-600">{t('delivery-terms.intro.line2')}</p>
              <p className="text-gray-600">{t('delivery-terms.intro.line3')}</p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('delivery-terms.minOrder.title')}</h2>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>{t('delivery-terms.minOrder.item19')}</li>
              <li>{t('delivery-terms.minOrder.item5')}</li>
              <li>{t('delivery-terms.minOrder.itemOther')}</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('delivery-terms.orderRegistration.title')}</h2>
            <div className="text-gray-600 mt-2 space-y-1">
              <p>{t('delivery-terms.orderRegistration.monThu')}</p>
              <p>{t('delivery-terms.orderRegistration.fri')}</p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('delivery-terms.deliveryDay.title')}</h2>
            <p className="text-gray-600 mt-2">{t('delivery-terms.deliveryDay.nextDay')}</p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>{t('delivery-terms.deliveryDay.monFri')}</li>
              <li>{t('delivery-terms.deliveryDay.sat')}</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('delivery-terms.officeHours.title')}</h2>
            <div className="text-gray-600 mt-2 space-y-1">
              <p>{t('delivery-terms.officeHours.monFri')}</p>
              <p>{t('delivery-terms.officeHours.satHolidays')}</p>
              <p>{t('delivery-terms.officeHours.sun')}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
