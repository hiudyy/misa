/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  findDuplicatePrefixLocale,
  isValidPrefixSymbol,
  resolveCommandPrefix,
} from "../src/helpers/resolveCommandPrefix.js";

describe("resolveCommandPrefix", () => {
  it("uses only legacy prefix when map is empty", () => {
    const resolved = resolveCommandPrefix("!ping", {}, "!");
    assert.strictEqual(resolved.matched, true);
    assert.strictEqual(resolved.prefix, "!");
    assert.strictEqual(resolved.locale, undefined);
  });

  it("does not match other symbols when map is empty", () => {
    const resolved = resolveCommandPrefix("/ping", {}, "!");
    assert.strictEqual(resolved.matched, false);
  });

  it("matches mapped locale prefix and returns locale", () => {
    const resolved = resolveCommandPrefix("/ping", { en: "/", pt: "!" }, "!");
    assert.strictEqual(resolved.matched, true);
    assert.strictEqual(resolved.prefix, "/");
    assert.strictEqual(resolved.locale, "en");
  });

  it("falls back to legacy when body does not match the map", () => {
    const resolved = resolveCommandPrefix("!ping", { en: "/" }, "!");
    assert.strictEqual(resolved.matched, true);
    assert.strictEqual(resolved.prefix, "!");
    assert.strictEqual(resolved.locale, undefined);
  });

  it("prefers the longest matching prefix", () => {
    const resolved = resolveCommandPrefix("!!help", { pt: "!", en: "!!" }, "#");
    assert.strictEqual(resolved.matched, true);
    assert.strictEqual(resolved.prefix, "!!");
    assert.strictEqual(resolved.locale, "en");
  });

  it("validates prefix symbols", () => {
    assert.strictEqual(isValidPrefixSymbol("!"), true);
    assert.strictEqual(isValidPrefixSymbol("!!"), true);
    assert.strictEqual(isValidPrefixSymbol(""), false);
    assert.strictEqual(isValidPrefixSymbol("a b"), false);
    assert.strictEqual(isValidPrefixSymbol("123456"), false);
  });

  it("detects duplicate prefixes across locales", () => {
    assert.strictEqual(findDuplicatePrefixLocale({ pt: "!", en: "/" }, "es", "!"), "pt");
    assert.strictEqual(findDuplicatePrefixLocale({ pt: "!", en: "/" }, "pt", "!"), undefined);
  });
});
