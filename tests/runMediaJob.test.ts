import { describe, it } from "node:test";
import assert from "node:assert";
import type { WASocket } from "baileys";
import { MediaQueue } from "../src/media/mediaQueue.js";
import { runMediaJob } from "../src/media/runMediaJob.js";

function context() {
  const sent: string[] = [];
  const misa = {
    sendMessage: async (_from: string, content: { text?: string }) => { sent.push(content.text ?? ""); },
  } as unknown as WASocket;
  return {
    sent,
    value: { misa, from: "chat", sender: "user", kind: "test", t: (key: string, vars?: Record<string, string>) => `${key}:${vars?.position ?? ""}` },
  };
}

describe("runMediaJob", () => {
  it("localizes a full queue", async () => {
    const state = context();
    const queue = new MediaQueue({ maxActive: 0, maxPending: 0 });
    assert.equal(await runMediaJob(state.value, async () => 1, { queue }), undefined);
    assert.deepEqual(state.sent, ["errors.media.queueFull:"]);
  });

  it("reports queue position and returns before execution completes", async () => {
    const queue = new MediaQueue({ maxActive: 1, timeoutMs: 1_000 });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const firstState = context();
    const secondState = context();
    secondState.value.sender = "other";
    const first = queue.run({ userId: "first", chatId: "chat", kind: "test" }, () => gate);
    let completed = false;
    const second = runMediaJob(secondState.value, async () => { completed = true; return 2; }, { queue });
    await second;
    await new Promise((resolve) => setTimeout(resolve, 1));
    assert.deepEqual(secondState.sent, ["errors.media.queued:1"]);
    assert.equal(completed, false);
    release();
    await first;
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(completed, true);
  });

  it("localizes a queue timeout", async () => {
    const state = context();
    const queue = new MediaQueue({ maxActive: 0, maxPending: 1, timeoutMs: 5 });
    assert.equal(await runMediaJob(state.value, async () => 1, { queue }), undefined);
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(state.sent, ["errors.media.queued:1", "errors.media.timeout:"]);
  });

  it("can wait for completion for dependent flows", async () => {
    const state = context();
    const queue = new MediaQueue({ maxActive: 1, timeoutMs: 1_000 });
    assert.equal(await runMediaJob(state.value, async () => 42, { queue, waitForCompletion: true }), 42);
  });

  it("handles unexpected background failures without unhandled rejection", async () => {
    const state = context();
    const queue = new MediaQueue({ maxActive: 1, timeoutMs: 1_000 });
    await runMediaJob(state.value, async () => { throw new Error("unexpected"); }, { queue });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(state.sent, ["errors.media.failed:"]);
  });
});
