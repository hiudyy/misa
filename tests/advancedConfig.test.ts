import { describe, it } from "node:test";
import assert from "node:assert";
import { parseAdvancedInteger, parseLogLevel } from "../src/config/advanced.js";

describe("advanced config parsers", () => {
  it("keeps current integer on empty input", () => assert.equal(parseAdvancedInteger(" ", 20, 0, 100, ), 20));
  it("accepts inclusive integer ranges", () => {
    assert.equal(parseAdvancedInteger("0", 2, 0, 10), 0);
    assert.equal(parseAdvancedInteger("10", 2, 0, 10), 10);
  });
  it("rejects decimals, text and out-of-range input", () => {
    assert.equal(parseAdvancedInteger("1.5", 2, 0, 10), null);
    assert.equal(parseAdvancedInteger("abc", 2, 0, 10), null);
    assert.equal(parseAdvancedInteger("11", 2, 0, 10), null);
  });
  it("parses log levels and keeps current on empty", () => {
    assert.equal(parseLogLevel(" WARN ", "info"), "warn");
    assert.equal(parseLogLevel("", "error"), "error");
    assert.equal(parseLogLevel("verbose", "info"), null);
  });
});
