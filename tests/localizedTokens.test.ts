import { describe, it } from "node:test";
import assert from "node:assert";
import {
  resolveLocalizedToken,
  replaceLocalizedPlaceholders,
  getLocalizedToken,
} from "../src/helpers/localizedTokens.js";

describe("localizedTokens", () => {
  it("resolves Portuguese token aliases", () => {
    assert.strictEqual(resolveLocalizedToken("pt", "ativar", ["on", "off"]), "on");
    assert.strictEqual(resolveLocalizedToken("pt", "desativar", ["on", "off"]), "off");
    assert.strictEqual(resolveLocalizedToken("pt", "punicao", ["punishment"]), "punicao");
  });

  it("resolves English token aliases", () => {
    assert.strictEqual(resolveLocalizedToken("en", "enable", ["on", "off"]), "on");
    assert.strictEqual(resolveLocalizedToken("en", "disable", ["on", "off"]), "off");
    assert.strictEqual(resolveLocalizedToken("en", "punishment", ["punishment"]), "punicao");
  });

  it("returns null for unknown input", () => {
    assert.strictEqual(resolveLocalizedToken("pt", "xyz", ["on", "off"]), null);
    assert.strictEqual(resolveLocalizedToken("en", undefined, ["on"]), null);
  });

  it("replaces localized placeholders", () => {
    const template = "Hello @usuario, welcome to @grupo";
    const result = replaceLocalizedPlaceholders(template, "pt", {
      user: "@12345",
      group: "My Group",
    });
    assert.strictEqual(result, "Hello @12345, welcome to My Group");
  });

  it("replaces English placeholders", () => {
    const template = "Hello @user, welcome to @group";
    const result = replaceLocalizedPlaceholders(template, "en", {
      user: "@12345",
      group: "My Group",
    });
    assert.strictEqual(result, "Hello @12345, welcome to My Group");
  });

  it("getLocalizedToken returns primary alias", () => {
    assert.strictEqual(getLocalizedToken("pt", "on"), "on");
    assert.strictEqual(getLocalizedToken("en", "on"), "on");
  });
});
