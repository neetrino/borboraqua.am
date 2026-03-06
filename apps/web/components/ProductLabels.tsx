import React from 'react';

export type ProductLabelPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ProductLabel {
  id: string;
  type: 'text' | 'percentage';
  value: string;
  position: ProductLabelPosition;
  color: string | null;
}

interface ProductLabelsProps {
  labels: ProductLabel[];
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

  // Փոքր logging, որ հեշտ լինի debug անել label-ների խնդիրները
  console.info('[UI][ProductLabels] Rendering labels', {
    total: labels.length,
    positions: labels.map((l) => l.position),
  });

  const positions: ProductLabelPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  const getColorClasses = () => {
    return 'text-[#00D1FF]';
  };

  const getCornerPositionClasses = (position: ProductLabelPosition) => {
    switch (position) {
      case 'top-left':
        return 'top-2 left-2 items-start';
      case 'top-right':
        return 'top-2 left-2 items-start';
      case 'bottom-left':
        return 'bottom-2 left-2 items-start';
      case 'bottom-right':
        return 'bottom-2 left-2 items-start';
      default:
        return '';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 md:translate-x-5">
      {positions.map((position) => {
        const labelsForPosition = labels.filter((label) => label.position === position);
        if (labelsForPosition.length === 0) return null;

        return (
          <div
            key={position}
            className={`absolute flex flex-col gap-1 ${getCornerPositionClasses(position)}`}
          >
            {labelsForPosition.map((label) => (
              <div
                key={label.id}
                className={`text-[14px] font-semibold pointer-events-auto ${getColorClasses()}`}
              >
                {label.type === 'percentage' ? `${label.value}%` : label.value}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};






