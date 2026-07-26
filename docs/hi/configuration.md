<!-- locale: hi; docs-version: 1 -->
# कॉन्फ़िगरेशन

एकमात्र स्रोत `dados/config.json` है। वर्तमान `schemaVersion` 1 है। बिना version वाली file migrate होती है; खराब JSON `.corrupt-*` में सुरक्षित रहता है। भविष्य का schema data बदले बिना startup रोकता है। Operational बदलाव के लिए restart जरूरी है।

Basic fields: `botName`, `ownerName`, `prefix`, `prefixByLocale`, `ownerNumber`, `autoUpdate`, `language`। `operations.media` में `maxConcurrent` 2, `maxPending` 20, `timeoutSeconds` 300, `ffmpegConcurrency` 1 और `maxFileSizeMiB`: image 20, audio 40, video/document 80, sticker 20 हैं।

`operations.youtube` में `providerRetries` 2, `retryDelaySeconds` 2, `maxFailures` 3, `cooldownMinutes` 300 हैं। `operations.logging.level` में `debug`, `info`, `warn`, `error`, `silent`; `operations.updates.maxBackups` default 5 है।

Advanced menu या बंद bot का JSON उपयोग करें। सीमाएँ: concurrency 1-16, queue 0-1000, timeout 1-3600 सेकंड, FFmpeg 1-4, size 1-2048 MiB, retries 1-10, delay 0-60, failures 1-20, cooldown 0-1440 मिनट, backups 1-50। `MISA_COMMIT_SHA` केवल build metadata है।
