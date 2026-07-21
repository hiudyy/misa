/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { textAfterTokens } from "../src/helpers/commandText.js";

describe("textAfterTokens", () => {
  it("returns full text when skipping zero tokens", () => {
    assert.strictEqual(textAfterTokens("ola\nmundo", 0), "ola\nmundo");
  });

  it("preserves newlines after skipping action tokens", () => {
    assert.strictEqual(textAfterTokens("texto linha1\nlinha2", 1), "linha1\nlinha2");
  });

  it("returns empty when not enough tokens", () => {
    assert.strictEqual(textAfterTokens("texto", 2), "");
  });
});
