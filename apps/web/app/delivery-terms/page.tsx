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
            <h2 className="text-2xl font-semibold text-gray-900">{t('delivery-terms.overview.title')}</h2>
            <p className="text-gray-600">
              {t('delivery-terms.overview.description')}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('delivery-terms.deliveryTimeframes.title')}</h2>
            <p className="text-gray-600">{t('delivery-terms.deliveryTimeframes.description')}</p>
            {t('delivery-terms.deliveryTimeframes.note') && (
              <p className="text-gray-600 mt-2">{t('delivery-terms.deliveryTimeframes.note')}</p>
            )}
            
            <div className="mt-4 space-y-4">
              {t('delivery-terms.deliveryTimeframes.weekdays.title') && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('delivery-terms.deliveryTimeframes.weekdays.title')}</h3>
                  <ul className="list-disc list-inside text-gray-600 ml-4">
                    {t('delivery-terms.deliveryTimeframes.weekdays.slot1') && (
                      <li>{t('delivery-terms.deliveryTimeframes.weekdays.slot1')}</li>
                    )}
                  </ul>
                </div>
              )}
              
              {t('delivery-terms.deliveryTimeframes.saturday.title') && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('delivery-terms.deliveryTimeframes.saturday.title')}</h3>
                  <ul className="list-disc list-inside text-gray-600 ml-4">
                    {t('delivery-terms.deliveryTimeframes.saturday.slot1') && (
                      <li>{t('delivery-terms.deliveryTimeframes.saturday.slot1')}</li>
                    )}
                  </ul>
                </div>
              )}
              
              {t('delivery-terms.deliveryTimeframes.sunday.title') && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('delivery-terms.deliveryTimeframes.sunday.title')}</h3>
                  {t('delivery-terms.deliveryTimeframes.sunday.note') && (
                    <p className="text-gray-600">{t('delivery-terms.deliveryTimeframes.sunday.note')}</p>
                  )}
                </div>
              )}
              
              {t('delivery-terms.deliveryTimeframes.yerevan.title') && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('delivery-terms.deliveryTimeframes.yerevan.title')}</h3>
                  {t('delivery-terms.deliveryTimeframes.yerevan.time') && (
                    <p className="text-gray-600">{t('delivery-terms.deliveryTimeframes.yerevan.time')}</p>
                  )}
                </div>
              )}
              
              {t('delivery-terms.deliveryTimeframes.regions.title') && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('delivery-terms.deliveryTimeframes.regions.title')}</h3>
                  {t('delivery-terms.deliveryTimeframes.regions.time') && (
                    <p className="text-gray-600">{t('delivery-terms.deliveryTimeframes.regions.time')}</p>
                  )}
                </div>
              )}
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('delivery-terms.deliveryOptions.title')}</h2>
            {t('delivery-terms.deliveryOptions.description') && (
              <p className="text-gray-600">{t('delivery-terms.deliveryOptions.description')}</p>
            )}
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-4">
              <li>{t('delivery-terms.deliveryOptions.items.sameDay')}</li>
              <li>{t('delivery-terms.deliveryOptions.items.express')}</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('delivery-terms.shippingFees.title')}</h2>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-4">
              <li>{t('delivery-terms.shippingFees.items.freeDelivery')}</li>
              <li>{t('delivery-terms.shippingFees.items.smallOrders')}</li>
              {t('delivery-terms.shippingFees.items.note') && (
                <li className="text-gray-500 italic">{t('delivery-terms.shippingFees.items.note')}</li>
              )}
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('delivery-terms.delaysDamageLoss.title')}</h2>
            {t('delivery-terms.delaysDamageLoss.description') && (
              <p className="text-gray-600">{t('delivery-terms.delaysDamageLoss.description')}</p>
            )}
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-4">
              <li>{t('delivery-terms.delaysDamageLoss.items.weather')}</li>
              <li>{t('delivery-terms.delaysDamageLoss.items.traffic')}</li>
              <li>{t('delivery-terms.delaysDamageLoss.items.volume')}</li>
            </ul>
            {t('delivery-terms.delaysDamageLoss.note') && (
              <p className="text-gray-600 mt-4">{t('delivery-terms.delaysDamageLoss.note')}</p>
            )}

          
          
          </Card>
        </div>
      </div>
    </div>
  );
}
