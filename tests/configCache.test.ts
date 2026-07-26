import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import { getBotConfig, clearBotConfigCache } from "../src/config.js";
import { getOwnerConfig, clearOwnerConfigCache } from "../src/ownerConfig.js";
import { clearGroupDataCache, getGroup, saveGroup } from "../src/database/groupDB.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { paths } from "../src/config/paths.js";

const files = new Set<string>();

afterEach(async () => {
  clearBotConfigCache();
  clearOwnerConfigCache();
  clearGroupDataCache();
  await Promise.all([...files].map((file) => fs.rm(file, { force: true })));
  files.clear();
});

describe("runtime config caches", () => {
  it("returns detached bot and owner config snapshots", async () => {
    const bot = await getBotConfig();
    const owner = await getOwnerConfig();
    bot.botName = "mutated";
    owner.blockedCommands.push("mutated");
    assert.notEqual((await getBotConfig()).botName, "mutated");
    assert.equal((await getOwnerConfig()).blockedCommands.includes("mutated"), false);
  });

  it("returns detached group snapshots and refreshes cache on save", async () => {
    const id = randomUUID().replace(/-/g, "");
    const groupId = `${id}@g.us`;
    files.add(path.join(paths.grupos, `${id}.json`));
    const initial = await getGroup(groupId);
    initial.soadmin = true;
    assert.equal((await getGroup(groupId)).soadmin, false);
    await saveGroup(groupId, { soadmin: true });
    assert.equal((await getGroup(groupId)).soadmin, true);
  });
});
