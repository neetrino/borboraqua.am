'use client';

import { useTranslation } from '../lib/i18n-client';

interface MobileBottleShowcaseProps {
  imageSrc: string;
}

export function MobileBottleShowcase({ imageSrc }: MobileBottleShowcaseProps) {
  const { t } = useTranslation();

  return (
    <div className="-translate-x-1/2 absolute left-1/2 top-[2185px] z-10 w-full max-w-[calc(100%-2rem)] min-[728px]:hidden px-4">
      <div className="relative h-[260px] w-full overflow-visible rounded-[44px] bg-[linear-gradient(180deg,#b0eaff_0%,#00a7e3_100%)]">
        <div className="absolute inset-x-0 top-[-52px] flex items-start justify-center">
          <img
            alt={t('home.bottleShowcase.imageAlt')}
            className="h-[228px] w-auto object-contain object-top"
            src={imageSrc}
            loading="lazy"
          />
        </div>

        <div className="absolute inset-[60%_6%_8%_6%] flex flex-col items-start justify-end">
          <div className="font-['Montserrat:Black',sans-serif] text-[25px] font-black uppercase leading-[25px] tracking-[-0.9px] text-white">
            <p className="mb-0">{t('home.bottleShowcase.titleLine1')}</p>
            <p className="mb-0">{t('home.bottleShowcase.titleLine2')}</p>
          </div>
          <div className="mt-1 font-['Inter:Bold_Italic',sans-serif] text-[12px] font-bold italic leading-[15px] text-white">
            <p className="mb-0">{t('home.bottleShowcase.subtitle')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
