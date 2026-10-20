export function formatPrice(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) throw new TypeError("not a finite number");
  return `$${n.toFixed(2)}`;
}
