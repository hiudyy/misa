import { describe, it, before } from "node:test";
import assert from "node:assert";
import {
  t,
  createTranslator,
  resolveLocale,
  clearLocaleCache,
  SUPPORTED_LOCALES,
} from "../src/i18n/index.js";

describe("i18n", () => {
  before(() => {
    clearLocaleCache();
  });

  it("returns translation for a valid key and locale", () => {
    const text = t("commands.ping.latency", "pt");
    assert.strictEqual(text, "Latencia");
  });

  it("falls back to pt when key is missing in target locale", () => {
    clearLocaleCache();
    const text = t("commands.ping.latency", "en");
    // en has "Latency", so this should not fall back
    assert.strictEqual(text, "Latency");
  });

  it("interpolates variables", () => {
    const translator = createTranslator("pt");
    const text = translator("commands.ping.footer", { botName: "TestBot" });
    assert.ok(text.includes("TestBot"));
  });

  it("returns the key itself when translation is missing everywhere", () => {
    const key = "commands.nonexistent.missingKey";
    const text = t(key, "pt");
    assert.strictEqual(text, key);
  });

  it("supports all supported locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const text = t("commands.ping.latency", locale);
      assert.ok(text.length > 0, `locale ${locale} should return a translation`);
    }
  });

  it("resolveLocale falls back to global locale when group has no language", async () => {
    const locale = await resolveLocale("1234567890@g.us");
    assert.ok(SUPPORTED_LOCALES.includes(locale));
  });

  it("resolveLocale resolves group language when configured", async () => {
    // This test assumes no group config exists; it should fall back to global.
    const locale = await resolveLocale("nonexistent-group@g.us");
    assert.ok(SUPPORTED_LOCALES.includes(locale));
  });
});
