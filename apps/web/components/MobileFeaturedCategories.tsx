'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '../lib/i18n-client';
import { FEATURED_CATEGORY_CONFIGS, type FeaturedCategoryId } from './featuredCategories.config';

const intersectSmall = '/assets/home/featured-categories/intersect-small.svg';
const drop = '/assets/home/featured-categories/drop.svg';
const bottleSmall = '/assets/home/featured-categories/bottle-small.svg';
const bottle1L = '/assets/home/featured-categories/bottle-1l.svg';
const intersectLarge = '/assets/home/featured-categories/intersect-large.svg';
const bottleLarge = '/assets/home/featured-categories/bottle-large.svg';
const waterDispenser = '/assets/home/featured-categories/water-dispenser.svg';

const CARD_SHELL_CLASSNAME =
  'relative h-[128px] w-[156px] shrink-0 overflow-hidden rounded-[31px] transition-transform duration-300 active:scale-[0.98] min-[381px]:h-[140px] min-[381px]:w-[171px] min-[381px]:rounded-[34px] min-[400px]:h-[154px] min-[400px]:w-[189px] min-[400px]:rounded-[38px] min-[728px]:h-[104px] min-[728px]:w-[128px] min-[728px]:rounded-[24px]';

const buildProductsCategoryHref = (categorySlugs: string[]): string => {
  const params = new URLSearchParams();
  params.set('category', categorySlugs.join(','));
  return `/products?${params.toString()}`;
};

interface CategoryCardButtonProps {
  ariaLabel: string;
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}

function CategoryCardButton({ ariaLabel, onClick, isActive = false, children }: CategoryCardButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`${CARD_SHELL_CLASSNAME} text-left ${isActive ? 'ring-2 ring-[#00d1ff] ring-offset-2 ring-offset-transparent' : ''}`}
    >
      <div className="relative h-[154px] w-[189px] origin-top-left scale-[0.825] min-[381px]:scale-[0.905] min-[400px]:scale-100 min-[728px]:scale-[0.675]">
        <div className="absolute inset-0 overflow-hidden rounded-[38px] bg-white/10 [box-shadow:0_1px_3px_rgba(0,0,0,0.25),inset_0_8px_4px_rgba(255,255,255,0.25)]">
          {children}
        </div>
      </div>
    </button>
  );
}

interface MobileFeaturedCategoriesProps {
  selectedCategoryId?: FeaturedCategoryId | null;
  onCategorySelect?: (categoryId: FeaturedCategoryId) => void;
}

export function MobileFeaturedCategories({
  selectedCategoryId = null,
  onCategorySelect,
}: MobileFeaturedCategoriesProps = {}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [smallPack, mediumPack, largePack, bulkPack] = FEATURED_CATEGORY_CONFIGS;

  const handleCategoryClick = (categoryId: FeaturedCategoryId, categorySlugs: readonly string[]) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
      return;
    }

    router.push(buildProductsCategoryHref([...categorySlugs]));
  };

  return (
    <div className="-translate-x-1/2 absolute left-1/2 top-[723px] min-[728px]:top-[768px] z-10 w-full max-w-[429px] min-[728px]:max-w-[700px] min-[1025px]:hidden">
      <div className="mb-3 min-[728px]:mb-2 flex flex-col items-center justify-center gap-[6px] min-[728px]:gap-[4px]">
        <div className="flex flex-col font-['Montserrat:Black',sans-serif] font-black justify-center leading-[30px] min-[728px]:leading-[26px] relative shrink-0 text-[28px] min-[728px]:text-[24px] text-center text-white tracking-[-0.9px] min-[728px]:tracking-[-0.7px] uppercase break-words">
          <p className="mb-0">{t('home.featuredCategories.title')}</p>
        </div>
        <div className="h-[4px] min-[728px]:h-[3px] w-[80px] min-[728px]:w-[56px] rounded-[30px] bg-[#00d1ff]" />
      </div>
      <div
        className="scrollbar-hide flex items-center justify-center gap-3 min-[381px]:gap-4 min-[728px]:gap-2 overflow-x-auto px-3 min-[381px]:px-4 min-[728px]:px-2 pb-2"
        aria-label={t('home.featuredCategories.sectionLabel')}
      >
        <CategoryCardButton
          ariaLabel={t(smallPack.labelKey)}
          onClick={() => handleCategoryClick(smallPack.id, smallPack.categorySlugs)}
          isActive={selectedCategoryId === smallPack.id}
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
              {t(smallPack.labelKey)}
            </p>
          </div>
        </CategoryCardButton>

        <CategoryCardButton
          ariaLabel={t(mediumPack.labelKey)}
          onClick={() => handleCategoryClick(mediumPack.id, mediumPack.categorySlugs)}
          isActive={selectedCategoryId === mediumPack.id}
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
              {t(mediumPack.labelKey)}
            </p>
          </div>
        </CategoryCardButton>

        <CategoryCardButton
          ariaLabel={t(largePack.labelKey)}
          onClick={() => handleCategoryClick(largePack.id, largePack.categorySlugs)}
          isActive={selectedCategoryId === largePack.id}
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
              {t(largePack.labelKey)}
            </p>
          </div>
        </CategoryCardButton>

        <CategoryCardButton
          ariaLabel={t(bulkPack.labelKey)}
          onClick={() => handleCategoryClick(bulkPack.id, bulkPack.categorySlugs)}
          isActive={selectedCategoryId === bulkPack.id}
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
              {t(bulkPack.labelKey)}
            </p>
          </div>
        </CategoryCardButton>
      </div>
    </div>
  );
}
