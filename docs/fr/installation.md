<!-- locale: fr; docs-version: 1 -->
# Installation

Misa nécessite Node.js 22 ou plus récent, npm et Git. Sous Linux/macOS, installez Node 22 avec nvm ; sous Windows, utilisez l’installateur officiel ou nvm-windows. Dans Termux : `pkg update && pkg install nodejs-lts git`. Clonez ensuite le dépôt :

```bash
npm ci
npm run build
npm run doctor
npm start
```

`npm start` ouvre le menu QR/pairing. `npm run start:fast` exécute TypeScript et `npm run start:prod` utilise `dist/`. Configuration, session, groupes et caches restent dans `dados/`; sauvegardez ce dossier et ne le publiez jamais.

## Docker

Initialisez le volume avec `docker compose run --rm misa npm start`, puis lancez `docker compose up -d` et consultez `docker compose logs -f`. Le volume `./dados:/app/dados` conserve l’authentification. Dans Docker, désactivez `autoUpdate` et reconstruisez l’image pour mettre à jour.

Sur Pterodactyl, choisissez Node.js 22, installez avec `npm ci`, compilez puis démarrez avec `npm run start:prod`. En cas de problème FFmpeg, QR ou session, exécutez `npm run doctor` et vérifiez les permissions de `dados/`.
