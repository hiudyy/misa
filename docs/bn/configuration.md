<!-- locale: bn; docs-version: 1 -->
# কনফিগারেশন

একমাত্র উৎস `dados/config.json`। বর্তমান `schemaVersion` 2। Version ছাড়া file migrate হয়; ভাঙা JSON `.corrupt-*` নামে সংরক্ষিত হয়। ভবিষ্যৎ schema data overwrite না করে startup থামায়। Operational পরিবর্তনে restart দরকার।

`operations.messages`-এ `maxConcurrent` (10, সীমা 1-50), `maxPending` (200, সীমা 0-5000) এবং `queueTimeoutSeconds` (60, সীমা 1-600) থাকে। Chat সিরিয়াল নয়; অতিরিক্ত বার্তা global backlog-এ অপেক্ষা করে।

Basic fields: `botName`, `ownerName`, `prefix`, `prefixByLocale`, `ownerNumber`, `autoUpdate`, `language`। `operations.media`: `maxConcurrent` 2, `maxPending` 20, `timeoutSeconds` 300, `ffmpegConcurrency` 1 এবং `maxFileSizeMiB`: image 20, audio 40, video/document 80, sticker 20।

`operations.youtube`: `providerRetries` 2, `retryDelaySeconds` 2, `maxFailures` 3, `cooldownMinutes` 300। `operations.logging.level`-এ `debug`, `info`, `warn`, `error`, `silent`; `operations.updates.maxBackups` default 5।

Advanced menu বা বন্ধ bot-এর JSON ব্যবহার করুন। সীমা: concurrency 1-16, queue 0-1000, timeout 1-3600 সেকেন্ড, FFmpeg 1-4, size 1-2048 MiB, retries 1-10, delay 0-60, failures 1-20, cooldown 0-1440 মিনিট, backups 1-50। `MISA_COMMIT_SHA` শুধু build metadata।
