import { test } from "node:test";
import assert from "node:assert/strict";
import { bulkPrice } from "../../src/bulk.js";
test("small order returns a number", () => { assert.ok(typeof bulkPrice(2, 3) === "number"); });
test("bulk order returns a number", () => { assert.ok(bulkPrice(2, 10) > 0); });
test("bad qty throws", () => { assert.throws(() => bulkPrice(2, 0)); });
