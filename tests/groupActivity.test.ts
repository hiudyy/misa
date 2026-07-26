import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { paths } from "../src/config/paths.js";
import {
  clearGroupActivityBufferForTests,
  flushGroupActivity,
  getUserActivity,
  recordGroupActivity,
} from "../src/helpers/groupActivity.js";

const files = new Set<string>();

afterEach(async () => {
  clearGroupActivityBufferForTests();
  await Promise.all([...files].map((file) => fs.rm(file, { force: true })));
  files.clear();
});

describe("group activity batching", () => {
  it("aggregates multiple events into one flushed state", async () => {
    const id = randomUUID().replace(/-/g, "");
    const groupId = `${id}@g.us`;
    const file = path.join(paths.dados, "atividade", `${id}.json`);
    files.add(file);
    recordGroupActivity(groupId, "user@lid", "message");
    recordGroupActivity(groupId, "user@lid", "message");
    recordGroupActivity(groupId, "user@lid", "command");
    await assert.rejects(fs.access(file));
    await flushGroupActivity(groupId);
    const saved = JSON.parse(await fs.readFile(file, "utf8"));
    assert.equal(saved.users["user@lid"].messages, 2);
    assert.equal(saved.users["user@lid"].commands, 1);
  });

  it("flushes pending deltas before a read", async () => {
    const id = randomUUID().replace(/-/g, "");
    const groupId = `${id}@g.us`;
    files.add(path.join(paths.dados, "atividade", `${id}.json`));
    recordGroupActivity(groupId, "user@lid", "sticker");
    const stats = await getUserActivity(groupId, "user@lid");
    assert.equal(stats.stickers, 1);
    assert.equal(stats.total, 1);
  });
});
