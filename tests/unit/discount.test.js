import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDiscount } from "../../src/discount.js";

test("rejects NaN", () => {
  assert.throws(() => applyDiscount(Number.NaN, "gold"), RangeError);
});

test("rejects non-number price", () => {
  assert.throws(() => applyDiscount("10", "gold"), RangeError);
});

test("zero price stays zero", () => {
  assert.equal(applyDiscount(0, "gold"), 0);
});
test("gold 15", () => { assert.equal(applyDiscount(200, "gold"), 170); });
