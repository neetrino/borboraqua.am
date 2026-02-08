'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';

/**
 * Terms of Service page - displays terms and conditions
 */
export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <h1 className="text-4xl font-bold text-gray-900">{t('terms.title')}</h1>
        <p className="text-gray-600">
          {t('terms.lastUpdated')}{' '}
          {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      
        <div className="mt-8 space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms.generalProvisions.title')}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.generalProvisions.item1')}</li>
            <li>{t('terms.generalProvisions.item2')}</li>
            <li>{t('terms.generalProvisions.item3')}</li>
            <li>{t('terms.generalProvisions.item4')}</li>
            <li>{t('terms.generalProvisions.item5')}</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">{t('terms.basicConcepts.title')}</h2>
          <p className="text-gray-600 mb-4">{t('terms.basicConcepts.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.basicConcepts.items.website')}</li>
            <li>{t('terms.basicConcepts.items.user')}</li>
            <li>{t('terms.basicConcepts.items.services')}</li>
            <li>{t('terms.basicConcepts.items.content')}</li>
            <li>{t('terms.basicConcepts.items.intellectualProperty')}</li>
            <li>{t('terms.basicConcepts.items.transaction')}</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">{t('terms.userObligations.title')}</h2>
          <p className="text-gray-600 mb-2">{t('terms.userObligations.item1')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.userObligations.items.legal')}</li>
            <li>{t('terms.userObligations.items.disrupt')}</li>
            <li>{t('terms.userObligations.items.viruses')}</li>
            <li>{t('terms.userObligations.items.unauthorized')}</li>
            <li>{t('terms.userObligations.items.illegal')}</li>
          </ul>
          <p className="text-gray-600 mt-4">{t('terms.userObligations.item2')}</p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">{t('terms.limitationOfLiability.title')}</h2>
          <p className="text-gray-600 mb-2">{t('terms.limitationOfLiability.item1')}</p>
          <p className="text-gray-600 mb-2">{t('terms.limitationOfLiability.item2')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.limitationOfLiability.items.errors')}</li>
            <li>{t('terms.limitationOfLiability.items.falseInfo')}</li>
            <li>{t('terms.limitationOfLiability.items.thirdParty')}</li>
            <li>{t('terms.limitationOfLiability.items.accuracy')}</li>
          </ul>
          <p className="text-gray-600 mt-4">{t('terms.limitationOfLiability.item3')}</p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">{t('terms.intellectualProperty.title')}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.intellectualProperty.item1')}</li>
            <li>{t('terms.intellectualProperty.item2')}</li>
            <li>{t('terms.intellectualProperty.item3')}</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">{t('terms.paymentsAndReturns.title')}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.paymentsAndReturns.item1')}</li>
            <li>{t('terms.paymentsAndReturns.item2')}</li>
            <li>{t('terms.paymentsAndReturns.item3')}</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">{t('terms.disputeResolution.title')}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.disputeResolution.item1')}</li>
            <li>{t('terms.disputeResolution.item2')}</li>
            <li>{t('terms.disputeResolution.item3')}</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">{t('terms.forceMajeure.title')}</h2>
          <p className="text-gray-600 mb-2">{t('terms.forceMajeure.item1')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.forceMajeure.items.natural')}</li>
            <li>{t('terms.forceMajeure.items.government')}</li>
            <li>{t('terms.forceMajeure.items.military')}</li>
            <li>{t('terms.forceMajeure.items.technical')}</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">{t('terms.privacyAndDataProtection.title')}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.privacyAndDataProtection.item1')}</li>
            <li>{t('terms.privacyAndDataProtection.item2')}</li>
            <li>{t('terms.privacyAndDataProtection.item3')}</li>
          </ul>
        </Card>
        </div>
      </div>
    </div>
  );
}
