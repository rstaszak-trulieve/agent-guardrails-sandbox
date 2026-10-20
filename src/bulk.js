export function bulkPrice(unit, qty) {
  if (qty <= 0) throw new RangeError("qty must be positive");
  const total = unit * qty;
  return qty >= 10 ? Math.round(total * 0.9 * 100) / 100 : total;
}
