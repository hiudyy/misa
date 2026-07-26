<!-- locale: de; docs-version: 1 -->
# Installation

Misa benötigt Node.js 22 oder neuer, npm und Git. Unter Linux/macOS installierst du Node 22 mit nvm; unter Windows mit dem offiziellen Installer oder nvm-windows. In Termux: `pkg update && pkg install nodejs-lts git`. Repository klonen und reproduzierbar installieren:

```bash
npm ci
npm run build
npm run doctor
npm start
```

`npm start` öffnet das QR-/Pairing-Menü. `npm run start:fast` startet TypeScript, `npm run start:prod` nutzt `dist/`. Konfiguration, Sitzung, Gruppen und Cache liegen in `dados/`; sichere den Ordner und veröffentliche ihn nie.

## Docker

Volume initialisieren: `docker compose run --rm misa npm start`. Danach `docker compose up -d` und `docker compose logs -f`. `./dados:/app/dados` bewahrt die Anmeldung. In Docker sollte `autoUpdate` aus sein; Updates erfolgen per Image-Rebuild.

Für Pterodactyl Node.js 22 wählen, `npm ci`, Build und `npm run start:prod` verwenden. Bei FFmpeg-, QR- oder Sitzungsproblemen `npm run doctor` ausführen und Rechte von `dados/` prüfen. Sitzung nur für bewusstes neues Pairing löschen.
