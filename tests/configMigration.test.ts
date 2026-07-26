import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeBotConfig } from "../src/config.js";
import { CURRENT_CONFIG_SCHEMA_VERSION, migrateBotConfig } from "../src/config/migrations.js";
import { defaultOperationalConfig, normalizeOperationalConfig } from "../src/config/operations.js";

describe("bot config schema", () => {
  it("migrates unversioned config to schema 1 without losing fields", () => {
    const result = normalizeBotConfig({ botName: "Legacy", ownerName: "Owner", prefix: "#", language: "en" });
    assert.equal(result.schemaVersion, 1);
    assert.equal(result.botName, "Legacy");
    assert.equal(result.prefix, "#");
    assert.deepEqual(result.operations, defaultOperationalConfig);
  });

  it("is idempotent for current schema", () => {
    const once = migrateBotConfig({ schemaVersion: 1, botName: "Misa", operations: defaultOperationalConfig });
    assert.deepEqual(migrateBotConfig(once), once);
    assert.equal(CURRENT_CONFIG_SCHEMA_VERSION, 1);
  });

  it("rejects a future schema without normalizing it", () => {
    assert.throws(() => normalizeBotConfig({ schemaVersion: 2 }), /CONFIG_SCHEMA_UNSUPPORTED:2:1/);
  });

  it("repairs each operational field independently", () => {
    const normalized = normalizeOperationalConfig({
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
});
