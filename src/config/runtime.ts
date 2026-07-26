/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import type { OperationalConfig } from "./operations.js";
import { configureMediaQueue } from "../media/mediaQueue.js";
import { configureFfmpegLimiter } from "../media/ffmpegLimiter.js";
import { configureMediaLimits } from "../media/types.js";
import { configureDefaultYouTubePool } from "../helpers/youtube/index.js";
import { setLogLevel } from "../logger.js";

export function applyOperationalConfig(operations: OperationalConfig): void {
  configureMediaQueue({
    maxActive: operations.media.maxConcurrent,
    maxPending: operations.media.maxPending,
    timeoutMs: operations.media.timeoutSeconds * 1_000,
  });
  configureFfmpegLimiter(operations.media.ffmpegConcurrency);
  configureMediaLimits(operations.media.maxFileSizeMiB);
  configureDefaultYouTubePool({
    retries: operations.youtube.providerRetries,
    retryDelayMs: operations.youtube.retryDelaySeconds * 1_000,
    maxFailures: operations.youtube.maxFailures,
    cooldownMs: operations.youtube.cooldownMinutes * 60_000,
  });
  setLogLevel(operations.logging.level);
}
