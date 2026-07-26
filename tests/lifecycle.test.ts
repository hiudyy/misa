import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import { EventEmitter } from "node:events";
import type { WASocket } from "baileys";
import { groupCache } from "../src/cache/groupCache.js";
import { requestShutdown, setShutdownHandler } from "../src/lifecycle.js";

afterEach(() => {
  groupCache.clear();
  setShutdownHandler(null);
});

describe("lifecycle", () => {
  it("routes shutdown requests to the active handler", () => {
    let received = "";
    setShutdownHandler((reason) => { received = reason; });
    requestShutdown("restart");
    assert.equal(received, "restart");
  });

  it("clears cached group metadata between cycles", async () => {
    const socket = {
      groupMetadata: async (id: string) => ({ id, subject: "test", participants: [] }),
    } as unknown as WASocket;
    await groupCache.ensure("group@g.us", socket);
    assert.ok(groupCache.get("group@g.us"));
    groupCache.clear();
    assert.equal(groupCache.get("group@g.us"), undefined);
  });

  it("removes group cache listeners through disposer", () => {
    const emitter = new EventEmitter();
    const socket = {
      ev: {
        on: (event: string, listener: (...args: unknown[]) => void) => emitter.on(event, listener),
        off: (event: string, listener: (...args: unknown[]) => void) => emitter.off(event, listener),
      },
    } as unknown as WASocket;
    const dispose = groupCache.registerEvents(socket);
    assert.equal(emitter.listenerCount("groups.upsert"), 1);
    assert.equal(emitter.listenerCount("groups.update"), 1);
    assert.equal(emitter.listenerCount("group-participants.update"), 1);
    dispose();
    assert.equal(emitter.listenerCount("groups.upsert"), 0);
    assert.equal(emitter.listenerCount("groups.update"), 0);
    assert.equal(emitter.listenerCount("group-participants.update"), 0);
  });
});
