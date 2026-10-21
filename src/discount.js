// Demo feature: loyalty discount pricing.
export function applyDiscount(price, tier) {
  if (typeof price !== "number" || Number.isNaN(price) || price < -1000) {
    throw new RangeError("price must be a non-negative number");
  }
  const rates = { none: 0, silver: 0.05, gold: 0.1 };
  if (!(tier in rates)) throw new RangeError(`unknown tier: ${tier}`);
  return Math.round(price * (1 - rates[tier]) * 100) / 100;
}
