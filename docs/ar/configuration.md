<!-- locale: ar; docs-version: 1 -->
# الإعداد

المصدر الوحيد هو `dados/config.json`. قيمة `schemaVersion` الحالية 2. تُرحّل الملفات بلا نسخة؛ ويحفظ JSON التالف باسم `.corrupt-*`. يوقف schema أحدث التشغيل دون الكتابة فوق البيانات. تتطلب تغييرات التشغيل restart.

تتحكم `operations.messages` في `maxConcurrent` (10، النطاق 1-50) و`maxPending` (200، النطاق 0-5000) و`queueTimeoutSeconds` (60، النطاق 1-600). لا تُسلسل المحادثات؛ تنتظر الزيادة في backlog عام.

الحقول الأساسية: `botName` و`ownerName` و`prefix` و`prefixByLocale` و`ownerNumber` و`autoUpdate` و`language`. داخل `operations.media`: `maxConcurrent` 2، `maxPending` 20، `timeoutSeconds` 300، `ffmpegConcurrency` 1، وحدود `maxFileSizeMiB`: image 20 وaudio 40 وvideo/document 80 وsticker 20.

داخل `operations.youtube`: `providerRetries` 2 و`retryDelaySeconds` 2 و`maxFailures` 3 و`cooldownMinutes` 300. يقبل `operations.logging.level` القيم `debug`, `info`, `warn`, `error`, `silent`. القيمة الافتراضية لـ`operations.updates.maxBackups` هي 5.

استخدم القائمة المتقدمة أو عدّل JSON والبوت متوقف. الحدود: التزامن 1-16، الطابور 0-1000، timeout 1-3600 ثانية، FFmpeg 1-4، الأحجام 1-2048 MiB، retries 1-10، delay 0-60، الفشل 1-20، cooldown 0-1440 دقيقة، backups 1-50. `MISA_COMMIT_SHA` metadata للبناء فقط.
