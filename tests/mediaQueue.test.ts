import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { MediaQueue, MediaQueueCode, assertMediaQueueIdle } from "../src/media/mediaQueue.js";
import { resetMetricsForTests } from "../src/metrics.js";

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function abortableGate(signal: AbortSignal, gate: Promise<void>): Promise<void> {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    gate.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

describe("MediaQueue", () => {
  beforeEach(() => resetMetricsForTests());

  it("never exceeds global concurrency and one active job per user", async () => {
    const queue = new MediaQueue({ maxActive: 2, timeoutMs: 1_000 });
    const gates = [deferred(), deferred(), deferred()];
    let active = 0;
    let maxActive = 0;
    const userActive = new Map<string, number>();
    const maxByUser = new Map<string, number>();
    const run = (userId: string, index: number) => queue.run({ userId, chatId: "c", kind: "test" }, async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      const count = (userActive.get(userId) ?? 0) + 1;
      userActive.set(userId, count);
      maxByUser.set(userId, Math.max(maxByUser.get(userId) ?? 0, count));
      await gates[index].promise;
      active -= 1;
      userActive.set(userId, count - 1);
    });

    const jobs = [run("same", 0), run("same", 1), run("other", 2)];
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(queue.snapshot().active, 2);
    gates[0].resolve();
    gates[2].resolve();
    await new Promise((resolve) => setTimeout(resolve, 10));
    gates[1].resolve();
    await Promise.all(jobs);
    assert.equal(maxActive, 2);
    assert.equal(maxByUser.get("same"), 1);
  });

  it("exposes the configured timeout and limits", () => {
    const defaults = new MediaQueue().snapshot();
    assert.deepEqual(defaults, { active: 0, pending: 0, maxActive: 2, maxPending: 20, timeoutMs: 300_000 });
  });

  it("allows multiple queued jobs from one user and preserves eligible FIFO", async () => {
    const queue = new MediaQueue({ maxActive: 1, timeoutMs: 1_000 });
    const gate = deferred();
    const order: string[] = [];
    const first = queue.run({ userId: "u", chatId: "c", kind: "x" }, async () => { order.push("one"); await gate.promise; });
    const second = queue.run({ userId: "u", chatId: "c", kind: "x" }, async () => { order.push("two"); });
    const third = queue.run({ userId: "u", chatId: "c", kind: "x" }, async () => { order.push("three"); });
    assert.equal(queue.snapshot().pending, 2);
    gate.resolve();
    await Promise.all([first, second, third]);
    assert.deepEqual(order, ["one", "two", "three"]);
  });

  it("bypasses a blocked user at the queue head", async () => {
    const queue = new MediaQueue({ maxActive: 2, timeoutMs: 1_000 });
    const gate = deferred();
    const order: string[] = [];
    const first = queue.run({ userId: "u", chatId: "c", kind: "x" }, async () => { order.push("u-active"); await gate.promise; });
    const same = queue.run({ userId: "u", chatId: "c", kind: "x" }, async () => { order.push("u-next"); });
    const other = queue.run({ userId: "v", chatId: "c", kind: "x" }, async () => { order.push("v"); });
    await other;
    assert.deepEqual(order, ["u-active", "v"]);
    gate.resolve();
    await Promise.all([first, same]);
  });

  it("rejects when pending capacity is full", async () => {
    const queue = new MediaQueue({ maxActive: 1, maxPending: 1, timeoutMs: 1_000 });
    const gate = deferred();
    const first = queue.run({ userId: "a", chatId: "c", kind: "x" }, () => gate.promise);
    const second = queue.run({ userId: "b", chatId: "c", kind: "x" }, async () => undefined);
    await assert.rejects(
      queue.run({ userId: "c", chatId: "c", kind: "x" }, async () => undefined),
      new RegExp(MediaQueueCode.FULL),
    );
    gate.resolve();
    await Promise.all([first, second]);
  });

  it("times out an active job", async () => {
    const queue = new MediaQueue({ maxActive: 1, timeoutMs: 20 });
    const never = deferred();
    const active = queue.run({ userId: "a", chatId: "c", kind: "x" }, (signal) => abortableGate(signal, never.promise));
    await assert.rejects(active, new RegExp(MediaQueueCode.TIMEOUT));
  });

  it("rejects timeout even when the task swallows abort", async () => {
    const queue = new MediaQueue({ maxActive: 1, timeoutMs: 10 });
    const job = queue.run({ userId: "a", chatId: "c", kind: "x" }, async (signal) => {
      await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));
      return "swallowed";
    });
    await assert.rejects(job, new RegExp(MediaQueueCode.TIMEOUT));
  });

  it("times out a queued job", async () => {
    const queue = new MediaQueue({ maxActive: 0, timeoutMs: 20 });
    const pending = queue.run({ userId: "b", chatId: "c", kind: "x" }, async () => undefined);
    await assert.rejects(pending, new RegExp(MediaQueueCode.TIMEOUT));
  });

  it("cancels all jobs and remains reusable", async () => {
    const queue = new MediaQueue({ maxActive: 1, timeoutMs: 1_000 });
    const never = deferred();
    const active = queue.run({ userId: "a", chatId: "c", kind: "x" }, (signal) => abortableGate(signal, never.promise));
    const pending = queue.run({ userId: "b", chatId: "c", kind: "x" }, async () => undefined);
    const activeRejected = assert.rejects(active, new RegExp(MediaQueueCode.ABORTED));
    const pendingRejected = assert.rejects(pending, new RegExp(MediaQueueCode.ABORTED));
    queue.cancelAll();
    await activeRejected;
    await pendingRejected;
    assert.equal(await queue.run({ userId: "c", chatId: "c", kind: "x" }, async () => 42), 42);
  });

  it("rejects cancellation even when an active task returns after abort", async () => {
    const queue = new MediaQueue({ timeoutMs: 1_000 });
    const job = queue.run({ userId: "a", chatId: "c", kind: "x" }, async (signal) => {
      await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));
      return "ignored";
    });
    const rejected = assert.rejects(job, new RegExp(MediaQueueCode.ABORTED));
    await new Promise((resolve) => setTimeout(resolve, 1));
    queue.cancelAll();
    await rejected;
  });

  it("does not allow reconfiguration while a queue is active", async () => {
    const queue = new MediaQueue({ maxActive: 1, maxPending: 2, timeoutMs: 1_000 });
    const gate = deferred();
    const job = queue.run({ userId: "global", chatId: "c", kind: "x" }, () => gate.promise);
    await new Promise((resolve) => setTimeout(resolve, 1));
    assert.throws(() => assertMediaQueueIdle(queue), /MEDIA_QUEUE_RECONFIGURE_BUSY/);
    gate.resolve();
    await job;
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.doesNotThrow(() => assertMediaQueueIdle(queue));
  });
});
