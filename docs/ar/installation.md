<!-- locale: ar; docs-version: 1 -->
# التثبيت

يتطلب Misa إصدار Node.js 22 أو أحدث مع npm وGit. على Linux/macOS ثبّت Node 22 عبر nvm، وعلى Windows استخدم المثبّت الرسمي أو nvm-windows. في Termux نفّذ `pkg update && pkg install nodejs-lts git`. بعد نسخ المستودع استخدم الخطوات القابلة للتكرار:

```bash
npm ci
npm run build
npm run doctor
npm start
```

يفتح `npm start` قائمة QR/pairing. يشغّل `npm run start:fast` TypeScript مباشرة، ويستخدم `npm run start:prod` مجلد `dist/`. تحفظ الإعدادات والجلسة والمجموعات والكاش داخل `dados/`؛ احتفظ بنسخة آمنة ولا تنشره.

## Docker

هيّئ المجلد بالأمر `docker compose run --rm misa npm start`، ثم شغّل `docker compose up -d` وراقب `docker compose logs -f`. يحفظ الربط `./dados:/app/dados` الجلسة. عطّل `autoUpdate` داخل Docker وحدّث بإعادة بناء الصورة.

في Pterodactyl اختر Node.js 22 واستخدم `npm ci` ثم build و`npm run start:prod`. عند مشكلة FFmpeg أو QR أو الجلسة، نفّذ `npm run doctor` وتحقق من صلاحيات `dados/`.
