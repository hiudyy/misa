<!-- locale: es; docs-version: 1 -->
# Configuración

La fuente única es `dados/config.json`. El `schemaVersion` actual es 1. Archivos sin versión se migran; JSON roto se conserva como `.corrupt-*`. Un schema futuro detiene el inicio sin sobrescribir datos. Los cambios operativos requieren reinicio.

Campos básicos: `botName`, `ownerName`, `prefix`, `prefixByLocale`, `ownerNumber`, `autoUpdate` y `language`. `operations.media` contiene `maxConcurrent` 2, `maxPending` 20, `timeoutSeconds` 300, `ffmpegConcurrency` 1 y `maxFileSizeMiB`: image 20, audio 40, video/document 80, sticker 20.

`operations.youtube` define `providerRetries` 2, `retryDelaySeconds` 2, `maxFailures` 3 y `cooldownMinutes` 300. `operations.logging.level` acepta `debug`, `info`, `warn`, `error`, `silent`. `operations.updates.maxBackups` vale 5.

Usa el menú avanzado o edita el JSON con el bot detenido. Rangos: concurrencia 1-16, cola 0-1000, timeout 1-3600 s, FFmpeg 1-4, tamaños 1-2048 MiB, retries 1-10, delay 0-60 s, fallos 1-20, cooldown 0-1440 min y backups 1-50. `MISA_COMMIT_SHA` solo describe el build.
