<!-- locale: bn; docs-version: 1 -->
# ইনস্টলেশন

Misa চালাতে Node.js 22 বা নতুন, npm এবং Git দরকার। Linux/macOS-এ nvm দিয়ে Node 22; Windows-এ অফিসিয়াল installer বা nvm-windows ব্যবহার করুন। Termux-এ `pkg update && pkg install nodejs-lts git` চালান। Repository clone করার পরে:

```bash
npm ci
npm run build
npm run doctor
npm start
```

`npm start` QR/pairing মেনু খোলে। `npm run start:fast` TypeScript এবং `npm run start:prod` `dist/` চালায়। Configuration, session, groups ও cache `dados/`-এ থাকে; backup রাখুন এবং কখনও প্রকাশ করবেন না।

## Docker

প্রথমে `docker compose run --rm misa npm start`, তারপর `docker compose up -d` এবং `docker compose logs -f`। `./dados:/app/dados` volume authentication সংরক্ষণ করে। Docker-এ `autoUpdate` বন্ধ রাখুন এবং update-এর জন্য image rebuild করুন।

Pterodactyl-এ Node.js 22, `npm ci`, build এবং `npm run start:prod` ব্যবহার করুন। FFmpeg, QR বা session সমস্যা হলে `npm run doctor` চালিয়ে `dados/` permission পরীক্ষা করুন।
