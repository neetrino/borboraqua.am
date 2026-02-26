'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';
import { borboraquaFaqCategories } from './questions';

/**
 * FAQ page - Borbor Aqua / New Aqua frequently asked questions
 */
export default function FAQPage() {
  const { t } = useTranslation();

  const faqs = borboraquaFaqCategories.map((cat) => ({
    category: cat.title,
    questions: cat.questions.map((item) => ({ q: item.q, a: item.a })),
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('faq.title')}</h1>
      <p className="text-gray-600 mb-8">
        {t('faq.description')}
      </p>

      <div className="space-y-8">
        {faqs.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.category}</h2>
            <div className="space-y-6">
              {section.questions.map((faq, faqIndex) => (
                <div key={faqIndex} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600 whitespace-pre-line">{faq.a}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

