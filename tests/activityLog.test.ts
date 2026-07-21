/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import type { proto } from "baileys";
import {
  formatActivityLine,
  getActivityPreview,
  getActivityUserName,
  PREVIEW_MAX_LENGTH,
  truncatePreview,
} from "../src/helpers/activityLog.js";

const t = (key: string, vars?: Record<string, string>) => {
  const map: Record<string, string> = {
    "logs.activity.group": "{{user}} → {{group}}  ·  {{preview}}",
    "logs.activity.private": "{{user}} → {{privateLabel}}  ·  {{preview}}",
    "logs.activity.privateLabel": "privado",
    "logs.activity.sticker": "figurinha",
    "logs.activity.media": "mídia",
    "logs.activity.unknownGroup": "grupo",
  };
  let text = map[key] ?? key;
  for (const [name, value] of Object.entries(vars ?? {})) {
    text = text.replaceAll(`{{${name}}}`, value);
  }
  return text;
};

describe("activityLog", () => {
  it("truncates long previews with ellipsis", () => {
    const long = "a".repeat(PREVIEW_MAX_LENGTH + 20);
    const preview = truncatePreview(long);
    assert.strictEqual(preview.length, PREVIEW_MAX_LENGTH);
    assert.ok(preview.endsWith("…"));
  });

  it("collapses whitespace before truncating", () => {
    assert.strictEqual(truncatePreview("oi\n\n  gente"), "oi gente");
  });

  it("prefers pushName and falls back to jid digits", () => {
    assert.strictEqual(
      getActivityUserName({ pushName: " Hiudy " } as proto.IWebMessageInfo, "5511999999999@s.whatsapp.net"),
      "Hiudy",
    );
    assert.strictEqual(
      getActivityUserName({} as proto.IWebMessageInfo, "5511999999999@s.whatsapp.net"),
      "5511999999999",
    );
  });

  it("formats group and private lines in style D", () => {
    assert.strictEqual(
      formatActivityLine(true, "120@g.us", "Hiudy", "oi", t),
      "Hiudy → grupo  ·  oi",
    );
    assert.strictEqual(
      formatActivityLine(false, "5511@s.whatsapp.net", "Hiudy", "!ping", t),
      "Hiudy → privado  ·  !ping",
    );
  });

  it("uses sticker/media labels when body is empty", () => {
    assert.strictEqual(
      getActivityPreview({ message: { stickerMessage: {} } } as proto.IWebMessageInfo, "", t),
      "figurinha",
    );
    assert.strictEqual(
      getActivityPreview({ message: { imageMessage: {} } } as proto.IWebMessageInfo, "", t),
      "mídia",
    );
  });
});
