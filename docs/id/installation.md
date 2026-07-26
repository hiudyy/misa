<!-- locale: id; docs-version: 1 -->
# Instalasi

Misa membutuhkan Node.js 22 atau lebih baru, npm, dan Git. Di Linux/macOS pasang Node 22 melalui nvm; di Windows gunakan installer resmi atau nvm-windows. Di Termux jalankan `pkg update && pkg install nodejs-lts git`. Clone repositori lalu gunakan alur berikut:

```bash
npm ci
npm run build
npm run doctor
npm start
```

`npm start` membuka menu QR/pairing. `npm run start:fast` menjalankan TypeScript dan `npm run start:prod` menjalankan `dist/`. Konfigurasi, sesi, grup, dan cache berada di `dados/`; buat backup dan jangan pernah mempublikasikannya.

## Docker

Siapkan volume dengan `docker compose run --rm misa npm start`, lalu `docker compose up -d` dan `docker compose logs -f`. Volume `./dados:/app/dados` menyimpan autentikasi. Pada Docker, nonaktifkan `autoUpdate` dan rebuild image untuk pembaruan.

Untuk Pterodactyl pilih Node.js 22, jalankan `npm ci`, build, lalu `npm run start:prod`. Jika FFmpeg, QR, atau sesi bermasalah, jalankan `npm run doctor`, periksa izin `dados/`, dan hapus sesi hanya bila ingin pairing ulang.
