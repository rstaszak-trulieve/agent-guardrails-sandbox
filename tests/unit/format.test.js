import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPrice } from "../../src/format.js";
test("formats to cents", () => { assert.equal(formatPrice(9.5), "$9.50"); });
test("rejects Infinity", () => { assert.throws(() => formatPrice(Infinity), TypeError); });
test("rejects strings", () => { assert.throws(() => formatPrice("1"), TypeError); });
