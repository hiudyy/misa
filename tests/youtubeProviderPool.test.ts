import { beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { YouTubeProviderPool } from "../src/helpers/youtube/providerPool.js";
import type { YouTubeProvider, YtProviderContext } from "../src/helpers/youtube/types.js";
import { resetMetricsForTests } from "../src/metrics.js";

const context: YtProviderContext = {
  fetch,
  sleep: async () => undefined,
};

function provider(name: string, resolve: YouTubeProvider["resolve"], supports?: YouTubeProvider["supports"]): YouTubeProvider {
  return { name, resolve, supports };
}

describe("YouTubeProviderPool", () => {
  beforeEach(() => resetMetricsForTests());

  it("falls back after retries and promotes the successful provider", async () => {
    let firstCalls = 0;
    const first = provider("first", async () => { firstCalls += 1; throw new Error("failed"); });
    const second = provider("second", async () => ({ url: "https://example.com/media" }));
    const pool = new YouTubeProviderPool([first, second], { retryDelayMs: 0 });
    const result = await pool.run("url", "mp3", context, async (selected, resolution) => `${selected.name}:${resolution.url}`);
    assert.equal(result, "second:https://example.com/media");
    assert.equal(firstCalls, 2);
    assert.deepEqual(pool.getOrder(), ["second", "first"]);
  });

  it("sleeps only between retries and reports the last error", async () => {
    let sleeps = 0;
    const failing = provider("fail", async () => { throw new Error("specific failure"); });
    const pool = new YouTubeProviderPool([failing], { retryDelayMs: 7 });
    await assert.rejects(pool.run("url", "mp3", { ...context, sleep: async (ms) => { assert.equal(ms, 7); sleeps += 1; } }, async () => undefined), /specific failure/);
    assert.equal(sleeps, 1);
  });

  it("promotes a successful provider even when earlier provider is unsupported", async () => {
    const unsupported = provider("unsupported", async () => ({ url: "x" }), () => false);
    const selected = provider("selected", async () => ({ url: "y" }));
    const pool = new YouTubeProviderPool([unsupported, selected]);
    await pool.run("url", "mp3", context, async () => undefined);
    assert.deepEqual(pool.getOrder(), ["selected", "unsupported"]);
  });

  it("treats download/use failure as provider failure", async () => {
    const one = provider("one", async () => ({ url: "https://one" }));
    const two = provider("two", async () => ({ url: "https://two" }));
    const pool = new YouTubeProviderPool([one, two], { retries: 1 });
    const result = await pool.run("url", "mp4", context, async (selected) => {
      if (selected.name === "one") throw new Error("bad media");
      return selected.name;
    });
    assert.equal(result, "two");
  });

  it("places a provider in cooldown after three failed rounds", async () => {
    let calls = 0;
    let now = 0;
    const failing = provider("failing", async () => { calls += 1; throw new Error("failed"); });
    const pool = new YouTubeProviderPool([failing], { retries: 1, maxFailures: 3, cooldownMs: 100, now: () => now });
    for (let i = 0; i < 3; i++) await assert.rejects(pool.run("url", "mp3", context, async () => undefined));
    await assert.rejects(pool.run("url", "mp3", context, async () => undefined));
    assert.equal(calls, 3);
    assert.equal(pool.getCooldownUntil("failing"), 100);
    now = 100;
    await assert.rejects(pool.run("url", "mp3", context, async () => undefined));
    assert.equal(calls, 4);
  });

  it("skips unsupported providers without counting an attempt", async () => {
    let calls = 0;
    const audioOnly = provider("audio", async () => { calls += 1; return { url: "x" }; }, (format) => format === "mp3");
    const video = provider("video", async () => ({ url: "video" }));
    const pool = new YouTubeProviderPool([audioOnly, video]);
    assert.equal(await pool.run("url", "mp4", context, async (selected) => selected.name), "video");
    assert.equal(calls, 0);
  });

  it("stops immediately when aborted", async () => {
    const controller = new AbortController();
    controller.abort(new Error("aborted"));
    const pool = new YouTubeProviderPool([provider("one", async () => ({ url: "x" }))]);
    await assert.rejects(pool.run("url", "mp3", { ...context, signal: controller.signal }, async () => undefined), /aborted/);
  });
});
