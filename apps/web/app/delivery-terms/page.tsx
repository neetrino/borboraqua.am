'use client';

import { useTranslation } from '../../lib/i18n-client';

/**
 * Delivery Terms page - describes shipping and delivery conditions
 */
export default function DeliveryTermsPage() {
  const { t } = useTranslation();
  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <div className="overflow-hidden bg-white/60 backdrop-blur-md border border-white/40 shadow-lg shadow-gray-200/50 rounded-xl">
          <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-white/50">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('delivery-terms.title')}</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {t('delivery-terms.lastUpdated')}{' '}
              {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="px-4 sm:px-6 pb-8 pt-6">
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
          </div>
        </div>
      </div>
    </div>
  );
}
