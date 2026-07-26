<!-- locale: es; docs-version: 1 -->
# Instalación

Misa requiere Node.js 22 o superior, npm y Git. En Linux/macOS instala Node 22 con nvm; en Windows usa el instalador oficial o nvm-windows. En Termux ejecuta `pkg update && pkg install nodejs-lts git`. Clona el repositorio y usa el flujo reproducible:

```bash
npm ci
npm run build
npm run doctor
npm start
```

`npm start` abre el menú de QR/pairing. `npm run start:fast` ejecuta TypeScript y `npm run start:prod` usa `dist/`. Configuración, sesión, grupos y caché están en `dados/`; respalda el directorio y nunca lo publiques.

## Docker

Inicializa con `docker compose run --rm misa npm start`; después usa `docker compose up -d` y `docker compose logs -f`. El volumen `./dados:/app/dados` conserva la autenticación. En Docker deja `autoUpdate` desactivado y reconstruye la imagen al actualizar.

En Pterodactyl selecciona Node.js 22, instala con `npm ci`, compila e inicia con `npm run start:prod`. Si fallan FFmpeg, QR o sesión, ejecuta `npm run doctor`, revisa permisos de `dados/` y elimina la sesión solo si quieres autenticar otra vez.
