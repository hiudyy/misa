<!-- locale: ur; docs-version: 1 -->
# ترتیب

واحد ذریعہ `dados/config.json` ہے۔ موجودہ `schemaVersion` 1 ہے۔ بغیر version file migrate ہوتی ہے؛ خراب JSON `.corrupt-*` میں محفوظ ہوتا ہے۔ مستقبل کا schema data بدلے بغیر startup روکتا ہے۔ Operational تبدیلی کے لیے restart ضروری ہے۔

Basic fields: `botName`, `ownerName`, `prefix`, `prefixByLocale`, `ownerNumber`, `autoUpdate`, `language`۔ `operations.media`: `maxConcurrent` 2، `maxPending` 20، `timeoutSeconds` 300، `ffmpegConcurrency` 1، اور `maxFileSizeMiB`: image 20، audio 40، video/document 80، sticker 20۔

`operations.youtube`: `providerRetries` 2، `retryDelaySeconds` 2، `maxFailures` 3، `cooldownMinutes` 300۔ `operations.logging.level` میں `debug`, `info`, `warn`, `error`, `silent`؛ `operations.updates.maxBackups` default 5۔

Advanced menu یا بند bot کا JSON استعمال کریں۔ حدود: concurrency 1-16، queue 0-1000، timeout 1-3600 سیکنڈ، FFmpeg 1-4، size 1-2048 MiB، retries 1-10، delay 0-60، failures 1-20، cooldown 0-1440 منٹ، backups 1-50۔ `MISA_COMMIT_SHA` صرف build metadata ہے۔
