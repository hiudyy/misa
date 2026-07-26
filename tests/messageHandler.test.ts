import { describe, it } from "node:test";
import assert from "node:assert";
import { EventEmitter } from "node:events";
import type { proto, WASocket } from "baileys";
import { setupMessageHandler } from "../src/handlers/messageHandler.js";
import { CommandHandler } from "../src/handlers/commandHandler.js";

function createSocket() {
  const emitter = new EventEmitter();
  const socket = {
    ev: {
      on: (event: string, listener: (...args: unknown[]) => void) => emitter.on(event, listener),
      off: (event: string, listener: (...args: unknown[]) => void) => emitter.off(event, listener),
    },
  } as unknown as WASocket;
  return { socket, emitter };
}

function message(id: string, chat: string): proto.IWebMessageInfo {
  return { key: { id, remoteJid: chat, fromMe: false }, message: { conversation: "hello" } };
}

describe("messageHandler", () => {
  it("processes messages from the same chat concurrently", async () => {
    const { socket, emitter } = createSocket();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let secondStarted = false;
    const control = setupMessageHandler(socket, new CommandHandler(), async (_socket, _commands, item) => {
      if (item.key?.id === "1") await gate;
      else secondStarted = true;
    });
    emitter.emit("messages.upsert", { type: "notify", messages: [message("1", "same"), message("2", "same")] });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(secondStarted, true);
    release();
    control.dispose();
    await control.drain();
  });

  it("processes every message in a notify batch", async () => {
    const { socket, emitter } = createSocket();
    const ids: string[] = [];
    const control = setupMessageHandler(socket, new CommandHandler(), async (_socket, _commands, item) => {
      ids.push(item.key?.id ?? "");
    });
    emitter.emit("messages.upsert", { type: "notify", messages: [message("1", "a"), message("2", "a")] });
    control.dispose();
    await control.drain();
    assert.deepEqual(ids, ["1", "2"]);
  });

  it("isolates a failed message and processes the next one", async () => {
    const { socket, emitter } = createSocket();
    const ids: string[] = [];
    const control = setupMessageHandler(socket, new CommandHandler(), async (_socket, _commands, item) => {
      if (item.key?.id === "1") throw new Error("expected");
      ids.push(item.key?.id ?? "");
    });
    emitter.emit("messages.upsert", { type: "notify", messages: [message("1", "a"), message("2", "a")] });
    control.dispose();
    await control.drain();
    assert.deepEqual(ids, ["2"]);
  });

  it("ignores append batches", async () => {
    const { socket, emitter } = createSocket();
    let calls = 0;
    const control = setupMessageHandler(socket, new CommandHandler(), async () => { calls += 1; });
    emitter.emit("messages.upsert", { type: "append", messages: [message("1", "a")] });
    control.dispose();
    await control.drain();
    assert.equal(calls, 0);
  });
});
