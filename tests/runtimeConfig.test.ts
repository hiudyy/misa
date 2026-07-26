import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import { applyOperationalConfig } from "../src/config/runtime.js";
import { defaultOperationalConfig } from "../src/config/operations.js";
import { mediaQueue } from "../src/media/mediaQueue.js";
import { ffmpegLimiter } from "../src/media/ffmpegLimiter.js";
import { getMediaLimit } from "../src/media/types.js";
import { getDefaultYouTubePool } from "../src/helpers/youtube/index.js";
import { getLogLevel } from "../src/logger.js";

afterEach(() => applyOperationalConfig(structuredClone(defaultOperationalConfig)));

describe("operational runtime", () => {
  it("applies queue, FFmpeg, limits, provider pool and logger", () => {
    const operations = structuredClone(defaultOperationalConfig);
    operations.media.maxConcurrent = 3;
    operations.media.maxPending = 7;
    operations.media.timeoutSeconds = 45;
    operations.media.ffmpegConcurrency = 2;
    operations.media.maxFileSizeMiB.image = 9;
    operations.youtube.providerRetries = 4;
    operations.youtube.retryDelaySeconds = 5;
    operations.youtube.maxFailures = 6;
    operations.youtube.cooldownMinutes = 7;
    operations.logging.level = "error";
    applyOperationalConfig(operations);

    assert.deepEqual(mediaQueue.snapshot(), { active: 0, pending: 0, maxActive: 3, maxPending: 7, timeoutMs: 45_000 });
    assert.equal(ffmpegLimiter.capacity, 2);
    assert.equal(getMediaLimit("image"), 9 * 1024 * 1024);
    assert.deepEqual(getDefaultYouTubePool().getConfiguration(), {
      retries: 4,
      retryDelayMs: 5_000,
      maxFailures: 6,
      cooldownMs: 7 * 60_000,
    });
    assert.equal(getLogLevel(), "error");
  });
});
