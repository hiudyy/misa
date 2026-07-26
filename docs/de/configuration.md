<!-- locale: de; docs-version: 1 -->
# Konfiguration

Einzige Quelle ist `dados/config.json`. Die aktuelle `schemaVersion` ist 1. Dateien ohne Version werden migriert; defektes JSON wird als `.corrupt-*` gesichert. Ein zukünftiges Schema stoppt den Start ohne Daten zu überschreiben. Betriebsänderungen brauchen einen Neustart.

Basisfelder: `botName`, `ownerName`, `prefix`, `prefixByLocale`, `ownerNumber`, `autoUpdate`, `language`. `operations.media`: `maxConcurrent` 2, `maxPending` 20, `timeoutSeconds` 300, `ffmpegConcurrency` 1, `maxFileSizeMiB` image 20, audio 40, video/document 80, sticker 20.

`operations.youtube`: `providerRetries` 2, `retryDelaySeconds` 2, `maxFailures` 3, `cooldownMinutes` 300. `operations.logging.level` erlaubt `debug`, `info`, `warn`, `error`, `silent`. `operations.updates.maxBackups` ist 5.

Nutze das erweiterte Menü oder bearbeite JSON bei gestopptem Bot. Bereiche: Parallelität 1-16, Queue 0-1000, timeout 1-3600 s, FFmpeg 1-4, Größen 1-2048 MiB, Retries 1-10, Delay 0-60 s, Fehler 1-20, Cooldown 0-1440 min, Backups 1-50. `MISA_COMMIT_SHA` ist nur Build-Metadata.
