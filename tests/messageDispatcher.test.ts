import { describe, it } from "node:test";
import assert from "node:assert";
import {
  MessageDispatcher,
  MessageDispatcherCode,
} from "../src/handlers/messageDispatcher.js";

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("MessageDispatcher", () => {
  it("uses the operational defaults 10/200/60s", () => {
    assert.deepEqual(new MessageDispatcher().snapshot(), {
      active: 0,
      pending: 0,
      maxConcurrent: 10,
      maxPending: 200,
      queueTimeoutMs: 60_000,
      accepting: true,
    });
  });

  it("never exceeds configured concurrency", async () => {
    const dispatcher = new MessageDispatcher({ maxConcurrent: 3, maxPending: 10, queueTimeoutMs: 1_000 });
    const gates = Array.from({ length: 6 }, () => deferred());
    let active = 0;
    let maxActive = 0;
    const tasks = gates.map((gate) => dispatcher.submit(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await gate.promise;
      active -= 1;
    }));
    await tick();
    assert.equal(dispatcher.snapshot().active, 3);
    assert.equal(dispatcher.snapshot().pending, 3);
    for (const gate of gates) {
      gate.resolve();
      await tick();
    }
    await Promise.all(tasks);
    assert.equal(maxActive, 3);
  });

  it("uses FIFO for pending work without chat keys", async () => {
    const dispatcher = new MessageDispatcher({ maxConcurrent: 1, maxPending: 5, queueTimeoutMs: 1_000 });
    const gate = deferred();
    const order: number[] = [];
    const first = dispatcher.submit(async () => { order.push(1); await gate.promise; });
    const second = dispatcher.submit(async () => { order.push(2); });
    const third = dispatcher.submit(async () => { order.push(3); });
    gate.resolve();
    await Promise.all([first, second, third]);
    assert.deepEqual(order, [1, 2, 3]);
  });

  it("rejects work beyond pending capacity", async () => {
    const dispatcher = new MessageDispatcher({ maxConcurrent: 1, maxPending: 1, queueTimeoutMs: 1_000 });
    const gate = deferred();
    const active = dispatcher.submit(() => gate.promise);
    const pending = dispatcher.submit(async () => undefined);
    await assert.rejects(dispatcher.submit(async () => undefined), new RegExp(MessageDispatcherCode.FULL));
    gate.resolve();
    await Promise.all([active, pending]);
  });

  it("times out only while pending", async () => {
    const dispatcher = new MessageDispatcher({ maxConcurrent: 1, maxPending: 2, queueTimeoutMs: 15 });
    const gate = deferred();
    const active = dispatcher.submit(() => gate.promise);
    const pending = dispatcher.submit(async () => undefined);
    await assert.rejects(pending, new RegExp(MessageDispatcherCode.TIMEOUT));
    assert.equal(dispatcher.snapshot().active, 1);
    gate.resolve();
    await active;
  });

  it("cancels pending work on stop and drains active work", async () => {
    const dispatcher = new MessageDispatcher({ maxConcurrent: 1, maxPending: 2, queueTimeoutMs: 1_000 });
    const gate = deferred();
    const active = dispatcher.submit(() => gate.promise);
    const pending = dispatcher.submit(async () => undefined);
    const rejected = assert.rejects(pending, new RegExp(MessageDispatcherCode.STOPPED));
    dispatcher.stop({ cancelPending: true });
    await rejected;
    await assert.rejects(dispatcher.submit(async () => undefined), new RegExp(MessageDispatcherCode.STOPPED));
    gate.resolve();
    await dispatcher.drain();
    await active;
    assert.deepEqual(dispatcher.snapshot(), {
      active: 0,
      pending: 0,
      maxConcurrent: 1,
      maxPending: 2,
      queueTimeoutMs: 1_000,
      accepting: false,
    });
  });
});
