export function clampCartQuantity(quantity: number, fallback = 1): number {
  if (!Number.isFinite(quantity)) {
    return fallback;
  }

  const normalized = Math.floor(quantity);
  if (normalized < 1) {
    return fallback;
  }

  return normalized;
}

export function maxAllowedQuantityByStock(stock?: number): number {
  if (typeof stock !== 'number' || !Number.isFinite(stock)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, Math.floor(stock));
}
