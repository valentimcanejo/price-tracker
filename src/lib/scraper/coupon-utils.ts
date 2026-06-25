export function extractCouponDiscount(couponText: string | null): number | null {
  if (!couponText) return null;
  const match = couponText.match(/(\d+)\s*%/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

export function applyDiscount(price: number, couponText: string | null): number | null {
  const pct = extractCouponDiscount(couponText);
  if (!pct) return null;
  return Math.round(price * (1 - pct / 100) * 100) / 100;
}
