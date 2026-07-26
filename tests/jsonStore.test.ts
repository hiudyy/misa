import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { drainJsonWrites, readJson, updateJson, writeJson } from "../src/storage/jsonStore.js";

type Counter = { count: number; label: string };
const defaults: Counter = { count: 0, label: "default" };
const normalize = (value: unknown): Counter => {
  const input = typeof value === "object" && value !== null ? value as Partial<Counter> : {};
  return {
    count: typeof input.count === "number" ? input.count : 0,
    label: typeof input.label === "string" ? input.label : "default",
  };
};

describe("jsonStore", () => {
  let directory: string;
  let file: string;

  beforeEach(async () => {
    directory = path.join(tmpdir(), `misa-json-${randomUUID()}`);
    file = path.join(directory, "state.json");
    await fs.mkdir(directory, { recursive: true });
  });

  afterEach(async () => {
    await drainJsonWrites();
    await fs.rm(directory, { force: true, recursive: true });
  });

  it("serializes concurrent read-modify-write updates", async () => {
    await Promise.all(Array.from({ length: 40 }, () => updateJson(
      file,
      { defaultValue: defaults, normalize },
      async (current) => ({ ...current, count: current.count + 1 }),
    )));
    assert.equal((await readJson(file, { defaultValue: defaults, normalize })).count, 40);
  });

  it("repairs valid fields and drops invalid fields", async () => {
    await fs.writeFile(file, JSON.stringify({ count: "bad", label: "kept", extra: true }));
    const result = await readJson(file, { defaultValue: defaults, normalize });
    assert.deepEqual(result, { count: 0, label: "kept" });
    assert.deepEqual(JSON.parse(await fs.readFile(file, "utf8")), result);
  });

  it("backs up malformed JSON and restores defaults", async () => {
    await fs.writeFile(file, "{broken", "utf8");
    const result = await readJson(file, { defaultValue: defaults, normalize });
    assert.deepEqual(result, defaults);
    const backups = (await fs.readdir(directory)).filter((name) => name.includes(".corrupt-"));
    assert.equal(backups.length, 1);
    assert.equal(await fs.readFile(path.join(directory, backups[0]), "utf8"), "{broken");
  });

  it("writes complete JSON without leaving temp files", async () => {
    await writeJson(file, { count: 2, label: "ok" });
    assert.deepEqual(JSON.parse(await fs.readFile(file, "utf8")), { count: 2, label: "ok" });
    assert.deepEqual((await fs.readdir(directory)).filter((name) => name.endsWith(".tmp")), []);
  });
});
