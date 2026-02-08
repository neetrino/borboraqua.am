'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';
import Link from 'next/link';

/**
 * Privacy Policy page - displays privacy policy information
 */
export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <h1 className="text-4xl font-bold text-gray-900">{t('privacy.title')}</h1>
        <p className="text-gray-600">
          {t('privacy.lastUpdated')}{' '}
          {new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <div className="mt-8 space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.introduction.title')}</h2>
            <p className="text-gray-600">
              {t('privacy.introduction.description1')}
            </p>
            <p className="text-gray-600">
              {t('privacy.introduction.description2')}
            </p>
            <p className="text-gray-600">
              {t('privacy.introduction.description3')}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('privacy.informationWeCollect.title')}</h2>
            <p className="text-gray-600">{t('privacy.informationWeCollect.description')}</p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-4">
              <li>{t('privacy.informationWeCollect.items.contact')}</li>
              <li>{t('privacy.informationWeCollect.items.purchase')}</li>
              <li>{t('privacy.informationWeCollect.items.technical')}</li>
              <li>{t('privacy.informationWeCollect.items.cookies')}</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('privacy.howWeUse.title')}</h2>
            <p className="text-gray-600">{t('privacy.howWeUse.description')}</p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-4">
              <li>{t('privacy.howWeUse.items.orders')}</li>
              <li>{t('privacy.howWeUse.items.support')}</li>
              <li>{t('privacy.howWeUse.items.improve')}</li>
              <li>{t('privacy.howWeUse.items.legal')}</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('privacy.dataRetention.title')}</h2>
            <p className="text-gray-600">{t('privacy.dataRetention.description')}</p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-4">
              <li>{t('privacy.dataRetention.items.account')}</li>
              <li>{t('privacy.dataRetention.items.purchase')}</li>
              <li>{t('privacy.dataRetention.items.marketing')}</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('privacy.dataSecurity.title')}</h2>
            <p className="text-gray-600">{t('privacy.dataSecurity.description')}</p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-4">
              <li>{t('privacy.dataSecurity.items.ssl')}</li>
              <li>{t('privacy.dataSecurity.items.access')}</li>
              <li>{t('privacy.dataSecurity.items.audits')}</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('privacy.informationSharing.title')}</h2>
            <p className="text-gray-600">
              {t('privacy.informationSharing.description')}
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-4">
              <li>{t('privacy.informationSharing.items.shipping')}</li>
              <li>{t('privacy.informationSharing.items.payment')}</li>
              <li>{t('privacy.informationSharing.items.law')}</li>
            </ul>
            {t('privacy.informationSharing.note') && (
              <p className="text-gray-600 mt-4">
                {t('privacy.informationSharing.note')}
              </p>
            )}

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('privacy.yourRights.title')}</h2>
            <p className="text-gray-600">{t('privacy.yourRights.description')}</p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-4">
              <li>{t('privacy.yourRights.items.access')}</li>
              <li>{t('privacy.yourRights.items.edit')}</li>
              <li>{t('privacy.yourRights.items.optout')}</li>
              <li>{t('privacy.yourRights.items.request')}</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('privacy.cookiesUsage.title')}</h2>
            <p className="text-gray-600">{t('privacy.cookiesUsage.description')}</p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-4">
              <li>{t('privacy.cookiesUsage.items.functional')}</li>
              <li>{t('privacy.cookiesUsage.items.analytical')}</li>
              <li>{t('privacy.cookiesUsage.items.marketing')}</li>
            </ul>
            {t('privacy.cookiesUsage.note') && (
              <p className="text-gray-600 mt-4">
                {t('privacy.cookiesUsage.note')}
              </p>
            )}

            <h2 className="text-2xl font-semibold text-gray-900 mt-6">{t('privacy.policyChanges.title')}</h2>
            <p className="text-gray-600">
              {t('privacy.policyChanges.description')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
