import { describe, it } from "node:test";
import assert from "node:assert";
import { FfmpegLimiter, assertFfmpegLimiterIdle } from "../src/media/ffmpegLimiter.js";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("FfmpegLimiter", () => {
  it("runs only one task at a time", async () => {
    const limiter = new FfmpegLimiter();
    let active = 0;
    let max = 0;
    const task = () => limiter.run(async () => {
      active += 1;
      max = Math.max(max, active);
      await wait(10);
      active -= 1;
    });
    await Promise.all([task(), task(), task()]);
    assert.equal(max, 1);
    assert.equal(limiter.active, 0);
  });

  it("supports configured parallel capacity", async () => {
    const limiter = new FfmpegLimiter(2);
    let active = 0;
    let max = 0;
    const task = () => limiter.run(async () => {
      active += 1;
      max = Math.max(max, active);
      await wait(10);
      active -= 1;
    });
    await Promise.all([task(), task(), task()]);
    assert.equal(max, 2);
    assert.equal(limiter.capacity, 2);
  });

  it("rejects invalid capacities", () => {
    assert.throws(() => new FfmpegLimiter(0), /FFMPEG_CONCURRENCY_INVALID/);
    assert.throws(() => new FfmpegLimiter(1.5), /FFMPEG_CONCURRENCY_INVALID/);
  });

  it("releases permission after failure", async () => {
    const limiter = new FfmpegLimiter();
    await assert.rejects(limiter.run(async () => { throw new Error("failed"); }), /failed/);
    assert.equal(await limiter.run(async () => "ok"), "ok");
  });

  it("removes an aborted waiter", async () => {
    const limiter = new FfmpegLimiter();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const first = limiter.run(() => gate);
    const controller = new AbortController();
    const second = limiter.run(async () => undefined, controller.signal);
    controller.abort(new Error("cancelled"));
    await assert.rejects(second, /cancelled/);
    release();
    await first;
    assert.equal(limiter.pending, 0);
  });

  it("rejects a signal aborted before enqueue", async () => {
    const limiter = new FfmpegLimiter();
    const controller = new AbortController();
    controller.abort(new Error("already aborted"));
    await assert.rejects(limiter.run(async () => undefined, controller.signal), /already aborted/);
    assert.equal(limiter.active, 0);
  });

  it("hands off to the next waiter after the first waiter aborts", async () => {
    const limiter = new FfmpegLimiter();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const first = limiter.run(() => gate);
    const controller = new AbortController();
    const second = limiter.run(async () => "second", controller.signal);
    const third = limiter.run(async () => "third");
    controller.abort(new Error("cancelled"));
    await assert.rejects(second, /cancelled/);
    release();
    await first;
    assert.equal(await third, "third");
    assert.equal(limiter.active, 0);
  });

  it("does not allow reconfiguration while a limiter is active", async () => {
    const limiter = new FfmpegLimiter(1);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const job = limiter.run(() => gate);
    await wait(1);
    assert.throws(() => assertFfmpegLimiterIdle(limiter), /FFMPEG_RECONFIGURE_BUSY/);
    release();
    await job;
    assert.doesNotThrow(() => assertFfmpegLimiterIdle(limiter));
  });
});
