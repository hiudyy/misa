import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import type { WASocket } from "baileys";
import { groupCache } from "../src/cache/groupCache.js";
import { isAdmin, isBotAdmin } from "../src/helpers/isAdmin.js";

afterEach(() => groupCache.clear());

describe("admin lookup", () => {
  it("shares metadata load and uses normalized participant IDs", async () => {
    let metadataCalls = 0;
    const participants = Array.from({ length: 500 }, (_, index) => ({
      id: `${index}@lid`,
      admin: index === 123 || index === 499 ? "admin" as const : null,
    }));
    const socket = {
      user: { id: "499@lid" },
      groupMetadata: async (id: string) => {
        metadataCalls += 1;
        return { id, subject: "test", participants };
      },
    } as unknown as WASocket;
    const [userAdmin, botAdmin] = await Promise.all([
      isAdmin("group@g.us", "123@lid", socket),
      isBotAdmin("group@g.us", socket),
    ]);
    assert.equal(userAdmin, true);
    assert.equal(botAdmin, true);
    assert.equal(metadataCalls, 1);
  });
});
