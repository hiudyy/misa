<!-- locale: pt; docs-version: 1 -->
# Instalação

O Misa requer Node.js 22 ou superior, npm e Git. Em Linux/macOS instale o Node 22 com nvm; no Windows use o instalador oficial ou nvm-windows. No Termux execute `pkg update && pkg install nodejs-lts git`. Em seguida clone o repositório e use o fluxo reproduzível:

```bash
npm ci
npm run build
npm run doctor
npm start
```

`npm start` abre o menu para configurar QR ou pairing. `npm run start:fast` inicia o TypeScript diretamente e `npm run start:prod` usa `dist/`. Todos os dados locais, sessão, grupos e configuração ficam em `dados/`; faça backup desse diretório e nunca o publique.

## Docker

Primeiro configure o volume: `docker compose run --rm misa npm start`. Depois execute `docker compose up -d` e acompanhe com `docker compose logs -f`. O volume `./dados:/app/dados` preserva a sessão. Em Docker mantenha `autoUpdate` desativado e atualize com rebuild da imagem. Para pairing, execute o container interativamente.

Em Pterodactyl use Node.js 22, `npm ci` na instalação e `npm run start:prod` após build. Se FFmpeg, QR ou sessão falharem, rode `npm run doctor`, confira permissões de `dados/` e remova somente a sessão quando realmente quiser autenticar novamente.
