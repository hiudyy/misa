<!-- locale: fr; docs-version: 1 -->
# Configuration

La source unique est `dados/config.json`. Le `schemaVersion` courant est 2. Un fichier sans version est migré ; un JSON cassé est sauvegardé en `.corrupt-*`. Un schema futur bloque le démarrage sans écraser les données. Les changements opérationnels nécessitent un restart.

`operations.messages` règle `maxConcurrent` (10, plage 1-50), `maxPending` (200, plage 0-5000) et `queueTimeoutSeconds` (60, plage 1-600). Les chats ne sont pas sérialisés ; le surplus attend dans un backlog global.

Champs simples : `botName`, `ownerName`, `prefix`, `prefixByLocale`, `ownerNumber`, `autoUpdate`, `language`. `operations.media` contient `maxConcurrent` 2, `maxPending` 20, `timeoutSeconds` 300, `ffmpegConcurrency` 1 et `maxFileSizeMiB` : image 20, audio 40, video/document 80, sticker 20.

`operations.youtube` : `providerRetries` 2, `retryDelaySeconds` 2, `maxFailures` 3, `cooldownMinutes` 300. `operations.logging.level` accepte `debug`, `info`, `warn`, `error`, `silent`. `operations.updates.maxBackups` vaut 5.

Utilisez le menu avancé ou éditez le JSON bot arrêté. Plages : concurrence 1-16, file 0-1000, timeout 1-3600 s, FFmpeg 1-4, tailles 1-2048 MiB, retries 1-10, délai 0-60 s, échecs 1-20, cooldown 0-1440 min et backups 1-50. `MISA_COMMIT_SHA` est uniquement une metadata de build.
