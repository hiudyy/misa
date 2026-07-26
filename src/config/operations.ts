/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export type OperationalConfig = {
  media: {
    maxConcurrent: number;
    maxPending: number;
    timeoutSeconds: number;
    ffmpegConcurrency: number;
    maxFileSizeMiB: {
      image: number;
      audio: number;
      video: number;
      document: number;
      sticker: number;
    };
  };
  youtube: {
    providerRetries: number;
    retryDelaySeconds: number;
    maxFailures: number;
    cooldownMinutes: number;
  };
  logging: {
    level: LogLevel;
  };
  updates: {
    maxBackups: number;
  };
};

export const defaultOperationalConfig: OperationalConfig = {
  media: {
    maxConcurrent: 2,
    maxPending: 20,
    timeoutSeconds: 300,
    ffmpegConcurrency: 1,
    maxFileSizeMiB: {
      image: 20,
      audio: 40,
      video: 80,
      document: 80,
      sticker: 20,
    },
  },
  youtube: {
    providerRetries: 2,
    retryDelaySeconds: 2,
    maxFailures: 3,
    cooldownMinutes: 300,
  },
  logging: {
    level: "info",
  },
  updates: {
    maxBackups: 5,
  },
};

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function boundedInteger(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

export function normalizeOperationalConfig(value: unknown): OperationalConfig {
  const input = asObject(value);
  const media = asObject(input.media);
  const sizes = asObject(media.maxFileSizeMiB);
  const youtube = asObject(input.youtube);
  const logging = asObject(input.logging);
  const updates = asObject(input.updates);
  const logLevel = logging.level;

  return {
    media: {
      maxConcurrent: boundedInteger(media.maxConcurrent, 1, 16, defaultOperationalConfig.media.maxConcurrent),
      maxPending: boundedInteger(media.maxPending, 0, 1_000, defaultOperationalConfig.media.maxPending),
      timeoutSeconds: boundedInteger(media.timeoutSeconds, 1, 3_600, defaultOperationalConfig.media.timeoutSeconds),
      ffmpegConcurrency: boundedInteger(media.ffmpegConcurrency, 1, 4, defaultOperationalConfig.media.ffmpegConcurrency),
      maxFileSizeMiB: {
        image: boundedInteger(sizes.image, 1, 2_048, defaultOperationalConfig.media.maxFileSizeMiB.image),
        audio: boundedInteger(sizes.audio, 1, 2_048, defaultOperationalConfig.media.maxFileSizeMiB.audio),
        video: boundedInteger(sizes.video, 1, 2_048, defaultOperationalConfig.media.maxFileSizeMiB.video),
        document: boundedInteger(sizes.document, 1, 2_048, defaultOperationalConfig.media.maxFileSizeMiB.document),
        sticker: boundedInteger(sizes.sticker, 1, 2_048, defaultOperationalConfig.media.maxFileSizeMiB.sticker),
      },
    },
    youtube: {
      providerRetries: boundedInteger(youtube.providerRetries, 1, 10, defaultOperationalConfig.youtube.providerRetries),
      retryDelaySeconds: boundedInteger(youtube.retryDelaySeconds, 0, 60, defaultOperationalConfig.youtube.retryDelaySeconds),
      maxFailures: boundedInteger(youtube.maxFailures, 1, 20, defaultOperationalConfig.youtube.maxFailures),
      cooldownMinutes: boundedInteger(youtube.cooldownMinutes, 0, 1_440, defaultOperationalConfig.youtube.cooldownMinutes),
    },
    logging: {
      level: logLevel === "debug" || logLevel === "info" || logLevel === "warn" || logLevel === "error" || logLevel === "silent"
        ? logLevel
        : defaultOperationalConfig.logging.level,
    },
    updates: {
      maxBackups: boundedInteger(updates.maxBackups, 1, 50, defaultOperationalConfig.updates.maxBackups),
    },
  };
}
