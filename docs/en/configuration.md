<!-- locale: en; docs-version: 1 -->
# Configuration

The single source is `dados/config.json`. Current `schemaVersion` is 2. Unversioned files migrate automatically; malformed JSON is preserved as `.corrupt-*`. A future schema stops startup without overwriting data. Operational changes require a restart.

`operations.messages` controls `maxConcurrent` (10, range 1-50), `maxPending` (200, range 0-5000), and `queueTimeoutSeconds` (60, range 1-600). Chats are not serialized; excess work waits in one global backlog.

Basic fields are `botName`, `ownerName`, `prefix`, `prefixByLocale`, `ownerNumber`, `autoUpdate`, and `language`. `operations.media` controls `maxConcurrent` (2), `maxPending` (20), `timeoutSeconds` (300), `ffmpegConcurrency` (1), and `maxFileSizeMiB`: image 20, audio 40, video/document 80, sticker 20.

`operations.youtube` contains `providerRetries` 2, `retryDelaySeconds` 2, `maxFailures` 3, and `cooldownMinutes` 300. `operations.logging.level` supports `debug`, `info`, `warn`, `error`, and `silent`. `operations.updates.maxBackups` defaults to 5.

Use the Advanced configuration menu or edit the stopped bot's JSON. Ranges are concurrency 1-16, queue 0-1000, timeout 1-3600 seconds, FFmpeg 1-4, sizes 1-2048 MiB, retries 1-10, delay 0-60 seconds, failures 1-20, cooldown 0-1440 minutes, and backups 1-50. `MISA_COMMIT_SHA` is build metadata only.
