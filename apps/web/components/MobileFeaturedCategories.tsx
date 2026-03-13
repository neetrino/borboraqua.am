'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '../lib/i18n-client';

const intersectSmall = '/assets/home/featured-categories/intersect-small.svg';
const drop = '/assets/home/featured-categories/drop.svg';
const bottleSmall = '/assets/home/featured-categories/bottle-small.svg';
const bottle1L = '/assets/home/featured-categories/bottle-1l.svg';
const intersectLarge = '/assets/home/featured-categories/intersect-large.svg';
const bottleLarge = '/assets/home/featured-categories/bottle-large.svg';
const waterDispenser = '/assets/home/featured-categories/water-dispenser.svg';
const intersectCooler = '/assets/home/featured-categories/intersect-cooler.svg';
const cooler = '/assets/home/featured-categories/cooler.svg';
const waterDrop = '/assets/home/featured-categories/water-drop.svg';
const accessories = '/assets/home/featured-categories/accessories.svg';

const CARD_SHELL_CLASSNAME =
  'relative h-[128px] w-[156px] shrink-0 overflow-hidden rounded-[31px] transition-transform duration-300 active:scale-[0.98] min-[381px]:h-[140px] min-[381px]:w-[171px] min-[381px]:rounded-[34px] min-[400px]:h-[154px] min-[400px]:w-[189px] min-[400px]:rounded-[38px] min-[728px]:h-[104px] min-[728px]:w-[128px] min-[728px]:rounded-[24px]';

const buildProductsSearchHref = (searchTerm: string): string =>
  `/products?search=${encodeURIComponent(searchTerm)}`;

const buildProductsCategoryHref = (categorySlugs: string[]): string => {
  const params = new URLSearchParams();
  params.set('category', categorySlugs.join(','));
  return `/products?${params.toString()}`;
};

interface CategoryCardButtonProps {
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
}

function CategoryCardButton({ ariaLabel, onClick, children }: CategoryCardButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${CARD_SHELL_CLASSNAME} text-left`}
    >
      <div className="relative h-[154px] w-[189px] origin-top-left scale-[0.825] min-[381px]:scale-[0.905] min-[400px]:scale-100 min-[728px]:scale-[0.675]">
        <div className="absolute inset-0 overflow-hidden rounded-[38px] bg-white/10 [box-shadow:0_1px_3px_rgba(0,0,0,0.25),inset_0_8px_4px_rgba(255,255,255,0.25)]">
          {children}
        </div>
      </div>
    </button>
  );
}

export function MobileFeaturedCategories() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="-translate-x-1/2 absolute left-1/2 top-[670px] min-[728px]:top-[740px] z-10 w-full max-w-[429px] min-[728px]:max-w-[700px] min-[1025px]:hidden">
      <div className="mb-3 min-[728px]:mb-2 flex flex-col items-center justify-center gap-[6px] min-[728px]:gap-[4px]">
        <div className="flex flex-col justify-center font-['Montserrat:Bold',sans-serif] text-[18px] min-[728px]:text-[16px] font-bold uppercase tracking-[-0.4px] text-white">
          <p className="mb-0 leading-[22px] min-[728px]:leading-[18px]">{t('home.featuredCategories.title')}</p>
        </div>
        <div className="h-[4px] min-[728px]:h-[3px] w-[48px] min-[728px]:w-[40px] rounded-[30px] bg-[#00d1ff]" />
      </div>
      <div
        className="scrollbar-hide flex items-center justify-center gap-3 min-[381px]:gap-4 min-[728px]:gap-2 overflow-x-auto px-3 min-[381px]:px-4 min-[728px]:px-2 pb-2"
        aria-label={t('home.featuredCategories.sectionLabel')}
      >
        <CategoryCardButton
          ariaLabel={t('home.featuredCategories.items.smallPack')}
          onClick={() => router.push(buildProductsCategoryHref(['0-25', '0-33l']))}
        >
          <div className="absolute left-[66px] top-[46px] flex size-[48.315px] items-center justify-center">
            <div className="-rotate-45">
              <img alt="" src={intersectSmall} className="block size-[34.164px] max-w-none" />
            </div>
          </div>
          <img
            alt=""
            src={drop}
            className="absolute left-[91px] top-[35px] h-[42px] w-[23px] max-w-none"
          />
          <img
            alt=""
            src={bottleSmall}
            className="absolute left-[61px] top-[38.8px] h-[54px] w-[54px] max-w-none"
          />
          <div className="absolute left-[calc(50%-47.5px)] top-[100px] flex flex-col justify-center font-['Montserrat:Bold',sans-serif] text-[16px] font-bold leading-[0] text-white">
            <p className="whitespace-nowrap leading-[25px]">
              {t('home.featuredCategories.items.smallPack')}
            </p>
          </div>
        </CategoryCardButton>

        <CategoryCardButton
          ariaLabel={t('home.featuredCategories.items.mediumPack')}
          onClick={() => router.push(buildProductsCategoryHref(['0-5l']))}
        >
          <div className="absolute left-[66px] top-[46px] flex size-[48.315px] items-center justify-center">
            <div className="-rotate-45">
              <img alt="" src={intersectSmall} className="block size-[34.164px] max-w-none" />
            </div>
          </div>
          <img
            alt=""
            src={drop}
            className="absolute inset-[16.88%_43.92%_55.84%_43.92%] h-[42px] w-[23px] max-w-none"
          />
          <img
            alt=""
            src={drop}
            className="absolute inset-[30.52%_35.98%_42.21%_51.85%] h-[42px] w-[23px] max-w-none"
          />
          <img
            alt=""
            src={bottleSmall}
            className="absolute left-[56px] top-[39.8px] h-[54px] w-[54px] max-w-none"
          />
          <div className="absolute left-[calc(50%-17.5px)] top-[100px] flex flex-col justify-center font-['Montserrat:Bold',sans-serif] text-[16px] font-bold leading-[0] text-white">
            <p className="whitespace-nowrap leading-[25px]">
              {t('home.featuredCategories.items.mediumPack')}
            </p>
          </div>
        </CategoryCardButton>

        <CategoryCardButton
          ariaLabel={t('home.featuredCategories.items.largePack')}
          onClick={() => router.push(buildProductsCategoryHref(['1l']))}
        >
          <img
            alt=""
            src={bottle1L}
            className="absolute inset-[20.13%_28.04%_38.96%_42.86%] h-[63px] w-[55px] max-w-none"
          />
          <div className="absolute left-[66px] top-[46px] flex size-[48.315px] items-center justify-center">
            <div className="-rotate-45">
              <img alt="" src={intersectSmall} className="block size-[34.164px] max-w-none" />
            </div>
          </div>
          <img
            alt=""
            src={bottleSmall}
            className="absolute left-[54px] top-[38.8px] h-[54px] w-[54px] max-w-none"
          />
          <div className="absolute left-[calc(50%-7.5px)] top-[100px] flex flex-col justify-center font-['Montserrat:Bold',sans-serif] text-[16px] font-bold leading-[0] text-white">
            <p className="whitespace-nowrap leading-[25px]">
              {t('home.featuredCategories.items.largePack')}
            </p>
          </div>
        </CategoryCardButton>

        <CategoryCardButton
          ariaLabel={t('home.featuredCategories.items.bulkPack')}
          onClick={() => router.push(buildProductsCategoryHref(['5l', '19l']))}
        >
          <div className="absolute left-[60px] top-[49px] flex size-[51.282px] items-center justify-center">
            <div className="-rotate-45">
              <img alt="" src={intersectLarge} className="block size-[36.262px] max-w-none" />
            </div>
          </div>
          <img
            alt=""
            src={bottleLarge}
            className="absolute bottom-1/2 left-[45.5%] right-[36.51%] top-[20.13%] h-[46px] w-[34px] max-w-none"
          />
          <img
            alt=""
            src={waterDispenser}
            className="absolute inset-[25.97%_41.8%_38.31%_35.45%] h-[55px] w-[43px] max-w-none"
          />
          <div className="absolute left-[calc(50%-30.5px)] top-[100px] flex flex-col justify-center font-['Montserrat:Bold',sans-serif] text-[16px] font-bold leading-[0] text-white">
            <p className="whitespace-nowrap leading-[25px]">
              {t('home.featuredCategories.items.bulkPack')}
            </p>
          </div>
        </CategoryCardButton>

        <CategoryCardButton
          ariaLabel={t('home.featuredCategories.items.coolers')}
          onClick={() => router.push(buildProductsSearchHref('cooler'))}
        >
          <div className="absolute left-[70px] top-[46px] flex size-[44.282px] items-center justify-center">
            <div className="-rotate-45">
              <img alt="" src={intersectCooler} className="block h-[30.932px] w-[31.693px] max-w-none" />
            </div>
          </div>
          <img
            alt=""
            src={cooler}
            className="absolute left-[92px] top-[30px] h-[64px] w-[26px] max-w-none"
          />
          <img
            alt=""
            src={waterDrop}
            className="absolute left-[56px] top-[46px] h-[54px] w-[54px] max-w-none"
          />
          <div className="absolute left-[calc(50%-31.5px)] top-[100px] flex flex-col justify-center font-['Montserrat:Bold',sans-serif] text-[16px] font-bold leading-[0] text-white">
            <p className="whitespace-nowrap leading-[25px]">
              {t('home.featuredCategories.items.coolers')}
            </p>
          </div>
        </CategoryCardButton>

        <CategoryCardButton
          ariaLabel={t('home.featuredCategories.items.accessories')}
          onClick={() => router.push(buildProductsSearchHref('accessory'))}
        >
          <div className="absolute left-[61px] top-[38px] flex size-[51.282px] items-center justify-center">
            <div className="-rotate-45">
              <img alt="" src={intersectLarge} className="block size-[36.262px] max-w-none" />
            </div>
          </div>
          <img
            alt=""
            src={bottleLarge}
            className="absolute inset-[27.92%_35.98%_42.21%_46.03%] h-[46px] w-[34px] max-w-none"
          />
          <img
            alt=""
            src={accessories}
            className="absolute inset-[26.62%_38.17%_31.26%_27.51%] h-[64.9px] w-[64.9px] max-w-none"
          />
          <div className="absolute left-[calc(50%-43px)] top-[100px] flex flex-col justify-center font-['Montserrat:Bold',sans-serif] text-[15px] font-bold leading-[0] text-white">
            <p className="whitespace-nowrap leading-[25px]">
              {t('home.featuredCategories.items.accessories')}
            </p>
          </div>
        </CategoryCardButton>
      </div>
    </div>
  );
}
