import React from 'react';

export type ProductLabelPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ProductLabel {
  id: string;
  type: 'text' | 'percentage';
  value: string;
  position: ProductLabelPosition;
  color: string | null;
  imageUrl?: string | null;
  imagePosition?: ProductLabelPosition | null;
}

interface ProductLabelsProps {
  labels: ProductLabel[];
}

interface ProductLabelItem {
  id: string;
  kind: 'text' | 'image';
  position: ProductLabelPosition;
  value?: string;
  color?: string | null;
  imageUrl?: string | null;
}

/**
 * ProductLabels
 *
 * UI-комպոնենտ, որը corner-երով խմբավորում է product-ի labels-ը
 * և նույն position ունեցող labels-ը ցուցադրում է vertical stack-ով։
 * Սա ապահովում է, որ միաժամանակ մի քանի label ունենալու դեպքում
 * դրանք իրար վրա չեն նստում, այլ ունեն հստակ вертикալ հեռավորություն։
 */
export const ProductLabels: React.FC<ProductLabelsProps> = ({ labels }) => {
  if (!labels || labels.length === 0) return null;

  const positions: ProductLabelPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  const items: ProductLabelItem[] = labels.flatMap((label) => {
    const nextItems: ProductLabelItem[] = [];
    const hasText = Boolean(label.value?.trim());
    const hasImage = Boolean(label.imageUrl);

    if (hasText) {
      nextItems.push({
        id: `${label.id}-text`,
        kind: 'text',
        position: label.position,
        value: label.type === 'percentage' ? `${label.value}%` : label.value,
        color: label.color,
      });
    }

    if (hasImage) {
      nextItems.push({
        id: `${label.id}-image`,
        kind: 'image',
        position: label.imagePosition ?? label.position,
        imageUrl: label.imageUrl,
      });
    }

    return nextItems;
  });

  if (items.length === 0) return null;

  const getCornerPositionClasses = (position: ProductLabelPosition) => {
    switch (position) {
      case 'top-left':
        return 'top-1 left-1 md:top-2 md:left-2 items-start';
      case 'top-right':
        return 'top-1 right-1 md:top-2 md:right-2 items-end';
      case 'bottom-left':
        return 'bottom-1 left-1 md:bottom-2 md:left-2 items-start';
      case 'bottom-right':
        return 'bottom-1 right-1 md:bottom-2 md:right-2 items-end';
      default:
        return '';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {positions.map((position) => {
        const itemsForPosition = items.filter((item) => item.position === position);
        if (itemsForPosition.length === 0) return null;

        return (
          <div
            key={position}
            className={`absolute flex flex-col gap-0.5 md:gap-1 ${getCornerPositionClasses(position)}`}
          >
            {itemsForPosition.map((item) =>
              item.kind === 'image' ? (
                <img
                  key={item.id}
                  src={item.imageUrl || ''}
                  alt=""
                  className={`pointer-events-auto h-8 w-8 md:h-12 md:w-12 object-contain ${position === 'top-right' ? '-translate-x-1' : ''}`}
                />
              ) : (
                <div
                  key={item.id}
                  className="pointer-events-auto text-[14px] font-semibold text-[#00D1FF]"
                >
                  {item.value}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};






