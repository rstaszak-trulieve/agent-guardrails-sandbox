// ACCEPTANCE CRITERIA - owned by the human (CODEOWNERS). Agents must not edit this directory.
// Story: "As a loyalty member I get a tiered discount; bad input is rejected."
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDiscount } from "../../src/discount.js";

test("AC1 gold members get 10% off", () => {
  assert.equal(applyDiscount(100, "gold"), 90);
});

test("AC2 silver members get 5% off, rounded to cents", () => {
  assert.equal(applyDiscount(19.99, "silver"), 18.99);
});

test("AC3 non-members pay full price", () => {
  assert.equal(applyDiscount(42, "none"), 42);
});

test("AC4 negative prices and unknown tiers are rejected", () => {
  assert.throws(() => applyDiscount(-1, "gold"), RangeError);
  assert.throws(() => applyDiscount(10, "platinum"), RangeError);
});
