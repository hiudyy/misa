<!-- locale: tr; docs-version: 1 -->
# Yapılandırma

Tek kaynak `dados/config.json` dosyasıdır. Güncel `schemaVersion` 2'dir. Sürümsüz dosya migrate edilir; bozuk JSON `.corrupt-*` olarak saklanır. Gelecek schema veriyi ezmeden startup'ı durdurur. Operasyon değişiklikleri restart gerektirir.

`operations.messages`, `maxConcurrent` (10, aralık 1-50), `maxPending` (200, aralık 0-5000) ve `queueTimeoutSeconds` (60, aralık 1-600) değerlerini yönetir. Chat'ler sıralanmaz; fazlalık global backlog'da bekler.

Temel alanlar: `botName`, `ownerName`, `prefix`, `prefixByLocale`, `ownerNumber`, `autoUpdate`, `language`. `operations.media`: `maxConcurrent` 2, `maxPending` 20, `timeoutSeconds` 300, `ffmpegConcurrency` 1 ve `maxFileSizeMiB`: image 20, audio 40, video/document 80, sticker 20.

`operations.youtube`: `providerRetries` 2, `retryDelaySeconds` 2, `maxFailures` 3, `cooldownMinutes` 300. `operations.logging.level` değerleri `debug`, `info`, `warn`, `error`, `silent`; `operations.updates.maxBackups` varsayılan 5.

Gelişmiş menüyü kullanın veya bot kapalıyken JSON düzenleyin. Aralıklar: concurrency 1-16, queue 0-1000, timeout 1-3600 saniye, FFmpeg 1-4, boyut 1-2048 MiB, retries 1-10, delay 0-60, failures 1-20, cooldown 0-1440 dakika, backups 1-50. `MISA_COMMIT_SHA` yalnızca build metadata bilgisidir.
