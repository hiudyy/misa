<!-- locale: id; docs-version: 1 -->
# Konfigurasi

Sumber tunggal adalah `dados/config.json`. `schemaVersion` saat ini 1. File tanpa versi dimigrasikan; JSON rusak disimpan sebagai `.corrupt-*`. Schema masa depan menghentikan startup tanpa menimpa data. Perubahan operasi membutuhkan restart.

Field dasar: `botName`, `ownerName`, `prefix`, `prefixByLocale`, `ownerNumber`, `autoUpdate`, `language`. `operations.media` berisi `maxConcurrent` 2, `maxPending` 20, `timeoutSeconds` 300, `ffmpegConcurrency` 1, dan `maxFileSizeMiB`: image 20, audio 40, video/document 80, sticker 20.

`operations.youtube`: `providerRetries` 2, `retryDelaySeconds` 2, `maxFailures` 3, `cooldownMinutes` 300. `operations.logging.level` menerima `debug`, `info`, `warn`, `error`, `silent`. `operations.updates.maxBackups` default 5.

Gunakan menu lanjutan atau edit JSON saat bot berhenti. Rentang: konkurensi 1-16, antrean 0-1000, timeout 1-3600 detik, FFmpeg 1-4, ukuran 1-2048 MiB, retry 1-10, delay 0-60 detik, gagal 1-20, cooldown 0-1440 menit, backup 1-50. `MISA_COMMIT_SHA` hanya metadata build.
