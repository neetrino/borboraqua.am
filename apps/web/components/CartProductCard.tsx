'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './CartProductCard.module.css';

export interface CartProductCardItem {
  id: string;
  variant: {
    id: string;
    sku: string;
    stock?: number;
    product: {
      id: string;
      title: string;
      slug: string;
      image?: string | null;
    };
  };
  quantity: number;
  price: number;
  originalPrice?: number | null;
  total: number;
  minimumOrderQuantity?: number;
  orderQuantityIncrement?: number;
}

interface CartProductCardProps {
  item: CartProductCardItem;
  formattedPrice: string;
  isUpdating: boolean;
  onRemove: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  removeAriaLabel: string;
  decreaseAriaLabel: string;
  increaseAriaLabel: string;
  /** Optional rating (e.g. 4.5). If not provided, rating row is hidden. */
  rating?: number | null;
}

/**
 * Cart product card — UI matches Figma design (borbor, node 312-1112).
 * Layout: image left, title/subtitle/rating/price center, remove top-right, quantity pill bottom-right.
 */
export function CartProductCard({
  item,
  formattedPrice,
  isUpdating,
  onRemove,
  onQuantityChange,
  removeAriaLabel,
  decreaseAriaLabel,
  increaseAriaLabel,
  rating = null,
}: CartProductCardProps) {
  const minQty = item.minimumOrderQuantity ?? 1;
  const step = item.orderQuantityIncrement ?? 1;
  const maxQty = item.variant.stock;

  const handleDecrease = () => {
    const next = item.quantity - step;
    if (next < minQty) {
      onQuantityChange(item.id, 0);
    } else {
      onQuantityChange(item.id, next);
    }
  };

  const handleIncrease = () => {
    if (maxQty !== undefined && item.quantity >= maxQty) return;
    onQuantityChange(item.id, item.quantity + step);
  };

  return (
    <article className={styles.card}>
      <Link href={`/products/${item.variant.product.slug}`} className={styles.imageWrap}>
        {item.variant.product.image ? (
          <Image
            src={item.variant.product.image}
            alt={item.variant.product.title}
            width={120}
            height={198}
            className={styles.image}
            sizes="120px"
            unoptimized
          />
        ) : (
          <div
            className={styles.image}
            style={{
              background: 'rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </Link>

      <div className={styles.info}>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className={styles.removeBtn}
          aria-label={removeAriaLabel}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 className={styles.title}>
          <Link href={`/products/${item.variant.product.slug}`} className="text-inherit hover:text-[#1ac0fd] transition-colors">
            {item.variant.product.title}
          </Link>
        </h2>
        {item.variant.sku ? (
          <p className={styles.subtitle}>{item.variant.sku}</p>
        ) : null}
        {rating != null && !Number.isNaN(rating) ? (
          <div className={styles.ratingRow}>
            <svg className={styles.ratingIcon} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9L8 13.5l-3.6 1.9.7-4L2.2 5.7l4-.6L8 1.5z" />
            </svg>
            <span>{rating.toFixed(1)}</span>
          </div>
        ) : null}
        <p className={styles.price}>{formattedPrice}</p>
      </div>

      <div className={styles.quantityWrap}>
        <button
          type="button"
          onClick={handleDecrease}
          disabled={isUpdating}
          className={styles.quantityBtn}
          aria-label={decreaseAriaLabel}
        >
          −
        </button>
        <span className={styles.quantityValue}>{item.quantity}</span>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={isUpdating || (maxQty !== undefined && item.quantity >= maxQty)}
          className={styles.quantityBtn}
          aria-label={increaseAriaLabel}
        >
          +
        </button>
      </div>
    </article>
  );
}
