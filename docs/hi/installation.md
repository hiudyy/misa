<!-- locale: hi; docs-version: 1 -->
# इंस्टॉलेशन

Misa के लिए Node.js 22 या नया, npm और Git चाहिए। Linux/macOS पर nvm से Node 22 स्थापित करें; Windows पर आधिकारिक installer या nvm-windows उपयोग करें। Termux में `pkg update && pkg install nodejs-lts git` चलाएँ। Repository clone करके यह क्रम अपनाएँ:

```bash
npm ci
npm run build
npm run doctor
npm start
```

`npm start` QR/pairing मेनू खोलता है। `npm run start:fast` TypeScript और `npm run start:prod` `dist/` चलाता है। कॉन्फ़िगरेशन, session, groups और cache `dados/` में रहते हैं; इसका backup रखें और इसे सार्वजनिक न करें।

## Docker

पहले `docker compose run --rm misa npm start`, फिर `docker compose up -d` और `docker compose logs -f`। `./dados:/app/dados` volume authentication बचाता है। Docker में `autoUpdate` बंद रखें और update के लिए image rebuild करें।

Pterodactyl में Node.js 22, `npm ci`, build और `npm run start:prod` उपयोग करें। FFmpeg, QR या session समस्या पर `npm run doctor` चलाएँ और `dados/` permissions जाँचें।
