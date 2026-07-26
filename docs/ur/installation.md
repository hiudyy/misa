<!-- locale: ur; docs-version: 1 -->
# انسٹالیشن

Misa کے لیے Node.js 22 یا نیا، npm اور Git درکار ہیں۔ Linux/macOS پر nvm کے ذریعے Node 22، Windows پر سرکاری installer یا nvm-windows استعمال کریں۔ Termux میں `pkg update && pkg install nodejs-lts git` چلائیں۔ Repository clone کرنے کے بعد:

```bash
npm ci
npm run build
npm run doctor
npm start
```

`npm start` QR/pairing مینو کھولتا ہے۔ `npm run start:fast` TypeScript اور `npm run start:prod` `dist/` چلاتا ہے۔ Configuration، session، groups اور cache `dados/` میں محفوظ ہوتے ہیں؛ backup رکھیں اور اسے عوامی نہ کریں۔

## Docker

پہلے `docker compose run --rm misa npm start`، پھر `docker compose up -d` اور `docker compose logs -f`۔ `./dados:/app/dados` volume authentication محفوظ رکھتا ہے۔ Docker میں `autoUpdate` بند رکھیں اور update کے لیے image rebuild کریں۔

Pterodactyl میں Node.js 22، `npm ci`، build اور `npm run start:prod` استعمال کریں۔ FFmpeg، QR یا session مسئلے پر `npm run doctor` اور `dados/` permissions چیک کریں۔
