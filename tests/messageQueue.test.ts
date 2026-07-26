import { describe, it } from "node:test";
import assert from "node:assert";
import { MessageQueue } from "../src/handlers/messageQueue.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("MessageQueue", () => {
  it("preserves ordering inside one chat", async () => {
    const queue = new MessageQueue();
    const order: number[] = [];
    const first = queue.enqueue("chat", async () => {
      await sleep(20);
      order.push(1);
    });
    const second = queue.enqueue("chat", async () => {
      order.push(2);
    });
    await Promise.all([first, second]);
    assert.deepEqual(order, [1, 2]);
  });

  it("runs different chats concurrently", async () => {
    const queue = new MessageQueue();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let secondStarted = false;
    const first = queue.enqueue("one", () => gate);
    const second = queue.enqueue("two", async () => { secondStarted = true; });
    await second;
    assert.equal(secondStarted, true);
    release();
    await first;
  });

  it("continues after a rejected message", async () => {
    const queue = new MessageQueue();
    await assert.rejects(queue.enqueue("chat", async () => { throw new Error("bad"); }), /bad/);
    let ran = false;
    await queue.enqueue("chat", async () => { ran = true; });
    assert.equal(ran, true);
  });

  it("stops admission and drains pending work", async () => {
    const queue = new MessageQueue();
    const pending = queue.enqueue("chat", async () => sleep(10));
    queue.stop();
    await assert.rejects(queue.enqueue("chat", async () => undefined), /STOPPED/);
    await queue.drain();
    await pending;
    assert.equal(queue.size, 0);
  });
});
