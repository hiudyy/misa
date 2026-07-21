/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FEMALE_PERCENT_TRAITS,
  INTERACTION_ACTIONS,
  MALE_PERCENT_TRAITS,
} from "../src/helpers/funGames.js";
import {
  countPercentTraitsWithMedia,
  formatFunTemplate,
  getPercentText,
  getRankHeader,
  resolveFunMediaPath,
} from "../src/helpers/funMedia.js";

const funDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "assets", "fun");

describe("funMedia", () => {
  it("formats #nome# and #level# placeholders", () => {
    const text = formatFunTemplate("Oi #nome# com #level#%", "@fulano", 42);
    assert.strictEqual(text, "Oi @fulano com 42%");
  });

  it("loads percent text templates", () => {
    const text = getPercentText("gay", "@fulano", 80, "fallback");
    assert.ok(text.includes("@fulano"));
    assert.ok(text.includes("80"));
    assert.notStrictEqual(text, "fallback");
  });

  it("loads rank headers", () => {
    const header = getRankHeader("rankgay", "fallback");
    assert.ok(header.toLowerCase().includes("gay") || header.includes("Gays"));
  });

  it("resolves local media paths that exist on disk", async () => {
    const media = resolveFunMediaPath("games", "gay");
    assert.ok(media);
    assert.strictEqual(media?.type, "image");
    await fs.access(media!.absolutePath);
  });

  it("has media manifest with local paths only", async () => {
    const raw = JSON.parse(await fs.readFile(path.join(funDir, "games.media.json"), "utf8")) as {
      games: Record<string, { image?: { path?: string; url?: string } }>;
    };
    for (const entry of Object.values(raw.games)) {
      assert.ok(entry.image?.path || entry.video?.path);
      assert.strictEqual(entry.image?.url, undefined);
    }
  });

  it("covers all percent traits via direct media or fallback", () => {
    const traits = [...MALE_PERCENT_TRAITS, ...FEMALE_PERCENT_TRAITS].map((t) => t.name);
    const { withMedia, total } = countPercentTraitsWithMedia(traits);
    assert.strictEqual(withMedia, total);
    assert.ok(total > 50);
  });

  it("resolves fallback media for traits without own image", async () => {
    const media = resolveFunMediaPath("games", "inteligente");
    assert.ok(media);
    await fs.access(media!.absolutePath);
  });

  it("resolves games2 media for every interaction command", async () => {
    for (const action of INTERACTION_ACTIONS) {
      const media = resolveFunMediaPath("games2", action.name);
      assert.ok(media, `missing media for ${action.name}`);
      await fs.access(media!.absolutePath);
    }
  });
});
