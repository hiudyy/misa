<!-- locale: en; docs-version: 1 -->
# Installation

Misa requires Node.js 22 or newer, npm, and Git. On Linux/macOS install Node 22 with nvm; on Windows use the official installer or nvm-windows. On Termux run `pkg update && pkg install nodejs-lts git`. Clone the repository and use the reproducible flow:

```bash
npm ci
npm run build
npm run doctor
npm start
```

`npm start` opens the QR/pairing configuration menu. `npm run start:fast` runs TypeScript directly, while `npm run start:prod` runs `dist/`. Local configuration, session, groups, and caches live under `dados/`; back up this directory and never publish it.

## Docker

Initialize the volume with `docker compose run --rm misa npm start`, then run `docker compose up -d` and inspect `docker compose logs -f`. The `./dados:/app/dados` volume preserves authentication. Keep `autoUpdate` disabled in Docker and rebuild the image for updates.

For Pterodactyl select Node.js 22, use `npm ci` during installation, build, and start with `npm run start:prod`. If FFmpeg, QR, or session checks fail, run `npm run doctor`, verify `dados/` permissions, and delete the session only when intentionally pairing again.
