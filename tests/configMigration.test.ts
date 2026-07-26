import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeBotConfig } from "../src/config.js";
import { CURRENT_CONFIG_SCHEMA_VERSION, migrateBotConfig } from "../src/config/migrations.js";
import { defaultOperationalConfig, normalizeOperationalConfig } from "../src/config/operations.js";

describe("bot config schema", () => {
  it("migrates unversioned config to schema 2 without losing fields", () => {
    const result = normalizeBotConfig({ botName: "Legacy", ownerName: "Owner", prefix: "#", language: "en" });
    assert.equal(result.schemaVersion, 2);
    assert.equal(result.botName, "Legacy");
    assert.equal(result.prefix, "#");
    assert.deepEqual(result.operations, defaultOperationalConfig);
  });

  it("is idempotent for current schema", () => {
    const once = migrateBotConfig({ schemaVersion: 2, botName: "Misa", operations: defaultOperationalConfig });
    assert.deepEqual(migrateBotConfig(once), once);
    assert.equal(CURRENT_CONFIG_SCHEMA_VERSION, 2);
  });

  it("rejects a future schema without normalizing it", () => {
    assert.throws(() => normalizeBotConfig({ schemaVersion: 3 }), /CONFIG_SCHEMA_UNSUPPORTED:3:2/);
  });

  it("repairs each operational field independently", () => {
    const normalized = normalizeOperationalConfig({
      messages: { maxConcurrent: 50, maxPending: -1, queueTimeoutSeconds: 601 },
      media: {
        maxConcurrent: 16,
        maxPending: -1,
        timeoutSeconds: 3601,
        ffmpegConcurrency: 4,
        maxFileSizeMiB: { image: 1, audio: 2048, video: 0, document: 80, sticker: 20 },
      },
      youtube: { providerRetries: 10, retryDelaySeconds: 60, maxFailures: 0, cooldownMinutes: 1440 },
      logging: { level: "warn" },
      updates: { maxBackups: 51 },
    });
    assert.deepEqual(normalized.messages, { maxConcurrent: 50, maxPending: 200, queueTimeoutSeconds: 60 });
    assert.equal(normalized.media.maxConcurrent, 16);
    assert.equal(normalized.media.maxPending, 20);
    assert.equal(normalized.media.timeoutSeconds, 300);
    assert.equal(normalized.media.ffmpegConcurrency, 4);
    assert.equal(normalized.media.maxFileSizeMiB.image, 1);
    assert.equal(normalized.media.maxFileSizeMiB.audio, 2048);
    assert.equal(normalized.media.maxFileSizeMiB.video, 80);
    assert.equal(normalized.youtube.providerRetries, 10);
    assert.equal(normalized.youtube.maxFailures, 3);
    assert.equal(normalized.logging.level, "warn");
    assert.equal(normalized.updates.maxBackups, 5);
  });

  it("migrates schema 1 by adding message dispatcher defaults", () => {
    const migrated = migrateBotConfig({ schemaVersion: 1, operations: { media: { maxConcurrent: 3 } } });
    assert.equal(migrated.schemaVersion, 2);
    assert.deepEqual((migrated.operations as Record<string, unknown>).messages, defaultOperationalConfig.messages);
  });
});
