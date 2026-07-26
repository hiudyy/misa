import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeBotConfig } from "../src/config.js";
import { normalizeOwnerConfig } from "../src/ownerConfig.js";
import { normalizeGroupData } from "../src/database/groupDB.js";

describe("persistence normalization", () => {
  it("repairs bot config fields independently", () => {
    const result = normalizeBotConfig({
      botName: "Custom",
      ownerName: 2,
      prefix: "bad prefix",
      language: "en",
      autoUpdate: "yes",
      prefixByLocale: { en: "/", invalid: "?", pt: "bad prefix" },
    });
    assert.equal(result.botName, "Custom");
    assert.equal(result.ownerName, "Hiudy");
    assert.equal(result.prefix, "!");
    assert.equal(result.language, "en");
    assert.equal(result.autoUpdate, false);
    assert.deepEqual(result.prefixByLocale, { en: "/" });
  });

  it("filters malformed owner restrictions", () => {
    const result = normalizeOwnerConfig({
      antiPrivate: true,
      blockedCommands: ["PING", 3, "ping", ""],
      blockedUsers: [
        { lid: "abc@lid", createdAt: "now", createdBy: "owner", expiresAt: 4 },
        { lid: 2 },
      ],
    });
    assert.equal(result.antiPrivate, true);
    assert.deepEqual(result.blockedCommands, ["ping"]);
    assert.equal(result.blockedUsers.length, 1);
    assert.equal(result.blockedUsers[0].expiresAt, null);
  });

  it("repairs nested group settings without losing valid values", () => {
    const result = normalizeGroupData({
      language: "es",
      prefix: "#",
      soadmin: true,
      antimidia: { foto: true, video: "yes" },
      antilink: { ativo: true, punicao: "banir", texto: "custom" },
      bemvindo: { ativo: true, legenda: "hello", midia: { tipo: "audio", path: "/tmp/a" } },
    });
    assert.equal(result.language, "es");
    assert.equal(result.prefix, "#");
    assert.equal(result.soadmin, true);
    assert.equal(result.antimidia.foto, true);
    assert.equal(result.antimidia.video, false);
    assert.deepEqual(result.antilink, { ativo: true, punicao: "banir", texto: "custom" });
    assert.equal(result.bemvindo.midia, null);
  });
});
