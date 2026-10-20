import { test } from "node:test";
import assert from "node:assert/strict";
import { bulkPrice } from "../../src/bulk.js";
test("under 10 units: no discount", () => { assert.equal(bulkPrice(2, 3), 6); assert.equal(bulkPrice(2, 9), 18); });
test("10+ units: 10% off, rounded to cents", () => { assert.equal(bulkPrice(2, 10), 18); assert.equal(bulkPrice(3.33, 11), 32.97); });
test("qty 1 is allowed", () => { assert.equal(bulkPrice(5, 1), 5); });
test("zero or negative qty rejected", () => { assert.throws(() => bulkPrice(2, 0), RangeError); assert.throws(() => bulkPrice(2, -1), RangeError); });
