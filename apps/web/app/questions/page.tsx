'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '../../lib/i18n-client';

/** FAQ category ids and number of questions (must match locale JSON structure) */
const FAQ_CATEGORIES = [
  { id: 'delivery', questionCount: 1 },
  { id: 'water', questionCount: 6 },
  { id: 'payment', questionCount: 3 },
] as const;

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 w-5 h-5 text-[#1ac0fd] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <svg viewBox="0 0 12 12" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 4.5L6 7.5L9 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * Questions page - accordion: title-ի սեղմումով բացվում/փակվում է պատասխանը
 */
export default function QuestionsPage() {
  const { t } = useTranslation();
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const faqs = useMemo(
    () =>
      FAQ_CATEGORIES.map((cat) => ({
        category: t(`faq.categories.${cat.id}.title`),
        questions: Array.from({ length: cat.questionCount }, (_, i) => ({
          q: t(`faq.categories.${cat.id}.questions.${i}.q`),
          a: t(`faq.categories.${cat.id}.questions.${i}.a`),
        })),
      })),
    [t]
  );

  const toggle = useCallback((key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <div className="overflow-hidden bg-white/60 backdrop-blur-md border border-white/40 shadow-lg shadow-gray-200/50 rounded-xl">
          {/* Form-like header */}
          <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-white/50">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {t('faq.title')}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {t('faq.description')}
            </p>
          </div>

          {/* Single page body: all sections in one block */}
          <div className="px-4 sm:px-6 pb-8">
            {faqs.map((section, sectionIndex) => (
              <div key={sectionIndex} className={sectionIndex > 0 ? 'pt-6 mt-6 border-t border-white/50' : 'pt-4'}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1ac0fd] mb-3 px-1">
                  {section.category}
                </h2>
                <div className="divide-y divide-white/50 rounded-lg overflow-hidden">
                  {section.questions.map((faq, faqIndex) => {
                    const key = `${sectionIndex}-${faqIndex}`;
                    const isOpen = openKeys.has(key);
                    return (
                      <div key={faqIndex} className="bg-transparent">
                        <button
                          type="button"
                          onClick={() => toggle(key)}
                          className="w-full flex items-center gap-3 text-left py-3.5 px-3 sm:px-4 hover:bg-white/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1ac0fd]/40 focus-visible:ring-offset-2 rounded-md"
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${key}`}
                          id={`faq-question-${key}`}
                        >
                          <span className="flex-1 text-base font-medium text-gray-900 pr-2">
                            {faq.q}
                          </span>
                          <ChevronIcon open={isOpen} />
                        </button>
                        <div
                          id={`faq-answer-${key}`}
                          role="region"
                          aria-labelledby={`faq-question-${key}`}
                          className="grid transition-[grid-template-rows] duration-200 ease-out"
                          style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <div className="pb-3.5 px-3 sm:px-4 pt-0">
                              <p className="text-gray-600 whitespace-pre-line text-[15px] leading-relaxed border-l-2 border-[#1ac0fd]/30 pl-4">
                                {faq.a}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

