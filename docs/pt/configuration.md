<!-- locale: pt; docs-version: 1 -->
# Configuração

A fonte única é `dados/config.json`. O `schemaVersion` atual é 1. Arquivos antigos sem versão são migrados; JSON quebrado recebe backup `.corrupt-*`. Schema futuro interrompe a inicialização sem sobrescrever dados. Mudanças operacionais exigem restart.

Campos básicos: `botName`, `ownerName`, `prefix`, `prefixByLocale`, `ownerNumber`, `autoUpdate` e `language`. A seção `operations.media` controla `maxConcurrent` (2), `maxPending` (20), `timeoutSeconds` (300), `ffmpegConcurrency` (1) e `maxFileSizeMiB` para image 20, audio 40, video/document 80 e sticker 20.

`operations.youtube` define `providerRetries` 2, `retryDelaySeconds` 2, `maxFailures` 3 e `cooldownMinutes` 300. `operations.logging.level` aceita `debug`, `info`, `warn`, `error` ou `silent`. `operations.updates.maxBackups` tem default 5.

Use a opção “Configuração avançada” do menu ou edite o JSON parado. Faixas: concorrência 1-16, fila 0-1000, timeout 1-3600 s, FFmpeg 1-4, tamanhos 1-2048 MiB, retries 1-10, delay 0-60 s, falhas 1-20, cooldown 0-1440 min e backups 1-50. `MISA_COMMIT_SHA` serve somente como metadata de build, não substitui operações.
