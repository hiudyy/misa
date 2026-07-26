<!-- locale: tr; docs-version: 1 -->
# Kurulum

Misa için Node.js 22 veya üstü, npm ve Git gerekir. Linux/macOS üzerinde nvm ile Node 22; Windows üzerinde resmi kurucu veya nvm-windows kullanın. Termux'ta `pkg update && pkg install nodejs-lts git` çalıştırın. Depoyu klonladıktan sonra:

```bash
npm ci
npm run build
npm run doctor
npm start
```

`npm start` QR/pairing menüsünü açar. `npm run start:fast` TypeScript'i, `npm run start:prod` ise `dist/` çıktısını çalıştırır. Yapılandırma, oturum, gruplar ve önbellek `dados/` altında tutulur; yedekleyin ve asla yayınlamayın.

## Docker

Önce `docker compose run --rm misa npm start`, ardından `docker compose up -d` ve `docker compose logs -f` kullanın. `./dados:/app/dados` volume oturumu korur. Docker'da `autoUpdate` kapalı olmalı ve güncelleme image rebuild ile yapılmalıdır.

Pterodactyl için Node.js 22 seçin, `npm ci`, build ve `npm run start:prod` kullanın. FFmpeg, QR veya oturum sorunu olursa `npm run doctor` çalıştırın ve `dados/` izinlerini kontrol edin.
