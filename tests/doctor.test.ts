import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { runDoctor } from "../scripts/doctor-lib.mjs";

const locales = ["ar", "bn", "de", "en", "es", "fr", "hi", "id", "pt", "tr", "ur"];

describe("doctor", () => {
  let root: string;
  beforeEach(async () => {
    root = path.join(tmpdir(), `misa-doctor-${randomUUID()}`);
    await fs.mkdir(path.join(root, "dist", "assets"), { recursive: true });
    await fs.mkdir(path.join(root, "dist", "i18n"), { recursive: true });
    await fs.mkdir(path.join(root, "dados"), { recursive: true });
    await fs.writeFile(path.join(root, "package.json"), "{}");
    await fs.writeFile(path.join(root, "package-lock.json"), "{}");
    await fs.writeFile(path.join(root, "dist", "index.js"), "");
    await fs.writeFile(path.join(root, "dist", "assets", "menu.jpeg"), "x");
    await fs.writeFile(path.join(root, "ffmpeg"), "x", { mode: 0o700 });
    await fs.writeFile(path.join(root, "dados", "config.json"), JSON.stringify({ schemaVersion: 1 }));
    await Promise.all(locales.map((locale) => fs.writeFile(path.join(root, "dist", "i18n", `${locale}.json`), "{}")));
  });
  afterEach(() => fs.rm(root, { recursive: true, force: true }));

  it("passes a complete installation", async () => {
    const result = await runDoctor(root, { nodeVersion: "22.15.0", ffmpegPath: path.join(root, "ffmpeg") });
    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  });

  it("reports old Node, future schema and incomplete build without secrets", async () => {
    await fs.writeFile(path.join(root, "dados", "config.json"), JSON.stringify({ schemaVersion: 2, ownerNumber: "5511999999999" }));
    await fs.rm(path.join(root, "dist", "index.js"));
    const result = await runDoctor(root, { nodeVersion: "20.0.0", ffmpegPath: path.join(root, "missing") });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /Node\.js >=22/);
    assert.match(result.errors.join("\n"), /schema 2/);
    assert.doesNotMatch(result.errors.join("\n"), /5511999999999/);
  });
});
