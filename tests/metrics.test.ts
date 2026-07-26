import { beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { metrics, resetMetricsForTests } from "../src/metrics.js";
import { averageDuration, cacheHitRate, formatMetricBytes, formatMetricDuration, topFailures } from "../src/helpers/metricsFormatting.js";

describe("metrics", () => {
  beforeEach(() => resetMetricsForTests());

  it("records aggregate counters and durations", () => {
    metrics.recordMessage("received");
    metrics.startCommand();
    metrics.recordCommand("ping", "success", 12);
    metrics.recordCommand("ping", "failure", 30);
    metrics.recordMedia("youtube", "success", 50);
    metrics.addMediaBytes(1024);
    const snapshot = metrics.snapshot();
    assert.equal(snapshot.messages.received, 1);
    assert.deepEqual(snapshot.commandStats.ping, {
      count: 2,
      totalMs: 42,
      maxMs: 30,
      success: 1,
      failure: 1,
    });
    assert.equal(snapshot.media.bytes, 1024);
  });

  it("tracks providers, cooldowns, caches and reconnects", () => {
    metrics.recordProvider("one", "failure", 20);
    metrics.recordProviderCooldown("one");
    metrics.recordCache("youtube", true);
    metrics.recordCache("youtube", false);
    metrics.recordReconnect();
    const snapshot = metrics.snapshot();
    assert.equal(snapshot.providers.one.failure, 1);
    assert.equal(snapshot.providers.one.cooldowns, 1);
    assert.deepEqual(snapshot.caches.youtube, { hits: 1, misses: 1 });
    assert.equal(snapshot.reconnects, 1);
  });

  it("returns snapshots detached from internal state", () => {
    metrics.recordMessage("received");
    const snapshot = metrics.snapshot();
    snapshot.messages.received = 99;
    assert.equal(metrics.snapshot().messages.received, 1);
  });

  it("formats status aggregates", () => {
    assert.equal(formatMetricBytes(1_048_576), "1.0 MiB");
    assert.equal(formatMetricDuration(1_500), "1.5 s");
    assert.equal(averageDuration({ a: { count: 2, totalMs: 30 }, b: { count: 1, totalMs: 30 } }), 20);
    assert.equal(cacheHitRate({ one: { hits: 3, misses: 1 } }), "75.0%");
    assert.equal(topFailures({ b: { failure: 1 }, a: { failure: 2 }, c: { failure: 0 } }), "a:2, b:1");
  });
});
