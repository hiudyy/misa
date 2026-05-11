<div align="center">

<img src="src/assets/menu.jpeg" alt="Misa Bot" width="860" />

<img src="https://count.getloli.com/@misa?name=misa&theme=miku&padding=7&offset=0&align=top&scale=1&pixelated=0&darkmode=auto" alt="Contador de visitas do projeto" />

<br />

<a href="https://chat.whatsapp.com/IZRLPKgiDk6JLaNktVPE4M">
  <img src="https://img.shields.io/badge/WhatsApp-Entrar%20na%20comunidade-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Comunidade no WhatsApp" />
</a>
<a href="https://discord.gg/HhfnR7BSnS">
  <img src="https://img.shields.io/badge/Discord-Entrar%20no%20servidor-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Servidor no Discord" />
</a>

</div>

<details>
<summary><h2>🇧🇷 Português (Brasil)</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** é um bot avançado e modular para **WhatsApp**, construído inteiramente em **TypeScript** utilizando a biblioteca **Baileys** (Multi-Device). 

Feita para ser incrivelmente simples de instalar, fácil de manter e totalmente escalável. Com suporte nativo a internacionalização (i18n), a Misa fala **Português, Inglês e Espanhol**, sendo a escolha perfeita para comunidades de todos os tamanhos. Criado pela [Cognima](https://cognima.com.br/urls).

## 🌐 A Primeira Bot 100% Internacionalizada

A Misa não é apenas mais uma bot de WhatsApp. Ela foi projetada com uma arquitetura avançada de **internacionalização (i18n)**, destacando-se como a primeira bot Open Source verdadeiramente multilíngue da comunidade.

- **Idiomas Nativos:** Suporte total a **Português (PT)**, **Inglês (EN)** e **Espanhol (ES)**.
- **Tradução Completa:** Não são apenas os menus que mudam! Absolutamente **todo o ecossistema** é traduzido de forma impecável: alertas do terminal, mensagens de anti-link, logs internos, erros de API, setups de conexão e painéis interativos.
- **Aliases Dinâmicos:** A imersão é completa. Ao configurar o bot para Inglês, os próprios comandos do WhatsApp se adaptam ao idioma nativo. Em vez de usar `!nomegp`, o seu usuário poderá digitar livremente `!groupname`. O bot entende os aliases traduzidos automaticamente.
- **Independência por Grupo:** A Misa permite definir um idioma global, mas vai além: cada grupo pode escolher seu próprio idioma. Um administrador pode configurar o grupo para falar Espanhol, e a Misa passará a responder apenas em espanhol naquele grupo, enquanto atende o resto dos usuários em inglês ou português.

## Tutoriais

<details>
<summary><strong>Tutorial Linux</strong></summary>

### 1. Instale o Node.js

Use Node.js 22 ou superior.

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Confira:

```bash
node -v
npm -v
```

### 2. Baixe o projeto

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

Se você baixou o ZIP, extraia e entre na pasta do projeto.

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure

```bash
npm start
```

Escolha `Configurar bot` e preencha:

- Nome do bot
- Nome do dono
- Prefixo
- Número do dono com DDI
- API key da Misaka
- Atualização automática
- Idioma do bot (pt, es, en)

### 5. Inicie

Ainda no menu:

```text
2. Iniciar bot
```

Depois escolha QR Code ou pairing code.

### 6. Rodar direto

Depois da primeira configuração:

```bash
npm run start:fast
```

</details>

<details>
<summary><strong>Tutorial Windows</strong></summary>

### 1. Instale os programas

Instale:

- Node.js 22 ou superior: https://nodejs.org/
- Git: https://git-scm.com/

Depois abra o PowerShell e confira:

```powershell
node -v
npm -v
git --version
```

### 2. Baixe o projeto

```powershell
git clone https://github.com/hiudyy/misa.git
cd misa
```

Também dá para baixar o ZIP pelo GitHub, extrair e abrir o terminal dentro da pasta.

### 3. Instale as dependências

```powershell
npm install
```

### 4. Configure e inicie

```powershell
npm start
```

No menu, escolha:

```text
1. Configurar bot
```

Preencha os dados solicitados, como idioma e nome. Depois volte e escolha:

```text
2. Iniciar bot
```

Use QR Code ou pairing code.

### 5. Iniciar nas próximas vezes

```powershell
npm run start:fast
```

</details>

<details>
<summary><strong>Tutorial Android</strong></summary>

Este tutorial usa Termux.

### 1. Instale o Termux

Instale o Termux pelo F-Droid:

```text
https://f-droid.org/packages/com.termux/
```

Evite a versão antiga da Play Store.

### 2. Atualize os pacotes

```bash
pkg update -y
pkg upgrade -y
```

### 3. Instale Node.js e Git

```bash
pkg install -y nodejs git
```

Confira:

```bash
node -v
npm -v
git --version
```

### 4. Baixe o projeto

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

### 5. Instale dependências

```bash
npm install
```

### 6. Configure e inicie

```bash
npm start
```

Escolha `Configurar bot`, preencha os dados (incluindo o idioma) e depois use `Iniciar bot`.

Para pairing code, informe o número com DDI, por exemplo:

```text
5511999999999
```

### 7. Iniciar de novo

```bash
cd misa
npm run start:fast
```

</details>

<details>
<summary><strong>Tutorial VPS ou Pterodactyl</strong></summary>

### 1. Requisitos

Use uma egg/imagem com:

- Node.js 22+
- npm
- Git, se for clonar direto do repositório

### 2. Envie ou clone os arquivos

Via terminal:

```bash
git clone https://github.com/hiudyy/misa.git .
```

Ou envie os arquivos pelo gerenciador do painel.

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure

No console do painel:

```bash
npm start
```

Escolha `Configurar bot`. As perguntas (idioma, prefixo, API, etc) aparecem em linhas separadas para melhorar a leitura em painéis como Pterodactyl.

### 5. Comando de inicialização

Use:

```bash
npm run start:fast
```

Se ainda não tiver sessão, rode primeiro `npm start` para configurar QR Code ou pairing code.

### 6. Arquivos importantes

- `src/config.json`: configuração principal
- `dados/misa-qr/`: sessão do WhatsApp
- `dados/grupos/`: configurações dos grupos
- `dados/owner/config.json`: configurações feitas pelo dono via bot

</details>
<br>
</details>

<details>
<summary><h2>🇺🇸 English</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** is an advanced and modular **WhatsApp** bot, built entirely in **TypeScript** using the **Baileys** (Multi-Device) library.

Designed to be incredibly simple to install, easy to maintain, and fully scalable. With native internationalization (i18n) support, Misa speaks **Portuguese, English, and Spanish**, making it the perfect choice for communities of all sizes. Created by [Cognima](https://cognima.com.br/urls).

## 🌐 The First 100% Internationalized Bot

Misa is not just another WhatsApp bot. It was designed with an advanced **internationalization (i18n)** architecture, standing out as the first truly multi-language Open Source bot in the community.

- **Native Languages:** Full support for **Portuguese (PT)**, **English (EN)**, and **Spanish (ES)**.
- **Complete Translation:** It's not just the menus that change! Absolutely **the entire ecosystem** is flawlessly translated: terminal alerts, anti-link messages, internal logs, API errors, connection setups, and interactive panels.
- **Dynamic Aliases:** Complete immersion. When you set the bot to English, the WhatsApp commands themselves adapt to the native language. Instead of using `!nomegp`, your users can freely type `!groupname`. The bot understands the translated aliases automatically.
- **Group Independence:** Misa allows you to set a global language, but it goes further: each group can choose its own language. An administrator can configure a group to speak Spanish, and Misa will respond only in Spanish in that group, while serving the rest of the users in English or Portuguese.

## Tutorials

<details>
<summary><strong>Linux Tutorial</strong></summary>

### 1. Install Node.js

Use Node.js 22 or higher.

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node -v
npm -v
```

### 2. Download the project

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

If you downloaded the ZIP, extract it and enter the project folder.

### 3. Install dependencies

```bash
npm install
```

### 4. Configure

```bash
npm start
```

Choose `Configure bot` and fill in:

- Bot name
- Owner name
- Prefix
- Owner number with country code
- Misaka API key
- Auto update
- Bot language (pt, es, en)

### 5. Start

Still in the menu:

```text
2. Start bot
```

Then choose QR Code or pairing code.

### 6. Run directly

After the first configuration:

```bash
npm run start:fast
```

</details>

<details>
<summary><strong>Windows Tutorial</strong></summary>

### 1. Install the programs

Install:

- Node.js 22 or higher: https://nodejs.org/
- Git: https://git-scm.com/

Then open PowerShell and verify:

```powershell
node -v
npm -v
git --version
```

### 2. Download the project

```powershell
git clone https://github.com/hiudyy/misa.git
cd misa
```

You can also download the ZIP from GitHub, extract it, and open the terminal inside the folder.

### 3. Install dependencies

```powershell
npm install
```

### 4. Configure and start

```powershell
npm start
```

In the menu, choose:

```text
1. Configure bot
```

Fill in the requested data, such as language and name. Then go back and choose:

```text
2. Start bot
```

Use QR Code or pairing code.

### 5. Start next time

```powershell
npm run start:fast
```

</details>

<details>
<summary><strong>Android Tutorial</strong></summary>

This tutorial uses Termux.

### 1. Install Termux

Install Termux via F-Droid:

```text
https://f-droid.org/packages/com.termux/
```

Avoid the old version from the Play Store.

### 2. Update packages

```bash
pkg update -y
pkg upgrade -y
```

### 3. Install Node.js and Git

```bash
pkg install -y nodejs git
```

Verify:

```bash
node -v
npm -v
git --version
```

### 4. Download the project

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

### 5. Install dependencies

```bash
npm install
```

### 6. Configure and start

```bash
npm start
```

Choose `Configure bot`, fill in the data (including the language) and then use `Start bot`.

For pairing code, enter the number with country code, for example:

```text
1234567890
```

### 7. Start again

```bash
cd misa
npm run start:fast
```

</details>

<details>
<summary><strong>VPS or Pterodactyl Tutorial</strong></summary>

### 1. Requirements

Use an egg/image with:

- Node.js 22+
- npm
- Git, if cloning directly from the repository

### 2. Upload or clone the files

Via terminal:

```bash
git clone https://github.com/hiudyy/misa.git .
```

Or upload the files through the panel's manager.

### 3. Install dependencies

```bash
npm install
```

### 4. Configure

In the panel console:

```bash
npm start
```

Choose `Configure bot`. The questions (language, prefix, API, etc.) appear on separate lines to improve readability in panels like Pterodactyl.

### 5. Startup command

Use:

```bash
npm run start:fast
```

If you still don't have a session, run `npm start` first to configure QR Code or pairing code.

### 6. Important files

- `src/config.json`: main configuration
- `dados/misa-qr/`: WhatsApp session
- `dados/grupos/`: group configurations
- `dados/owner/config.json`: configurations made by the owner via bot

</details>
<br>
</details>

<details>
<summary><h2>🇪🇸 Español</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** es un bot avanzado y modular para **WhatsApp**, construido completamente en **TypeScript** utilizando la biblioteca **Baileys** (Multi-Device).

Diseñado para ser increíblemente fácil de instalar, de mantener y totalmente escalable. Con soporte nativo de internacionalización (i18n), Misa habla **Portugués, Inglés y Español**, siendo la elección perfecta para comunidades de todos los tamaños. Creado por [Cognima](https://cognima.com.br/urls).

## 🌐 El Primer Bot 100% Internacionalizado

Misa no es solo otro bot de WhatsApp. Fue diseñado con una arquitectura avanzada de **internacionalización (i18n)**, destacándose como el primer bot Open Source verdaderamente multilingüe en la comunidad.

- **Idiomas Nativos:** Soporte total para **Portugués (PT)**, **Inglés (EN)** y **Español (ES)**.
- **Traducción Completa:** ¡No son solo los menús los que cambian! Absolutamente **todo el ecosistema** está traducido impecablemente: alertas de la terminal, mensajes de anti-link, logs internos, errores de API, configuraciones de conexión y paneles interactivos.
- **Alias Dinámicos:** La inmersión es completa. Al configurar el bot en Inglés o Español, los comandos de WhatsApp se adaptan al idioma nativo. En lugar de usar `!nomegp`, tus usuarios podrán escribir libremente `!nombregrupo`. El bot entiende los alias traducidos automáticamente.
- **Independencia por Grupo:** Misa permite configurar un idioma global, pero va más allá: cada grupo puede elegir su propio idioma. Un administrador puede configurar un grupo para hablar Español, y Misa responderá solo en español en ese grupo, mientras atiende al resto de los usuarios en inglés o portugués.

## Tutoriales

<details>
<summary><strong>Tutorial Linux</strong></summary>

### 1. Instalar Node.js

Usa Node.js 22 o superior.

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifica:

```bash
node -v
npm -v
```

### 2. Descargar el proyecto

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

Si descargaste el ZIP, extráelo y entra a la carpeta del proyecto.

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar

```bash
npm start
```

Elige `Configurar bot` y llena:

- Nombre del bot
- Nombre del dueño
- Prefijo
- Número del dueño con código de país
- API key de Misaka
- Actualización automática
- Idioma del bot (pt, es, en)

### 5. Iniciar

Todavía en el menú:

```text
2. Iniciar bot
```

Luego elige QR Code o pairing code.

### 6. Ejecutar directamente

Después de la primera configuración:

```bash
npm run start:fast
```

</details>

<details>
<summary><strong>Tutorial Windows</strong></summary>

### 1. Instalar los programas

Instala:

- Node.js 22 o superior: https://nodejs.org/
- Git: https://git-scm.com/

Luego abre PowerShell y verifica:

```powershell
node -v
npm -v
git --version
```

### 2. Descargar el proyecto

```powershell
git clone https://github.com/hiudyy/misa.git
cd misa
```

También puedes descargar el ZIP desde GitHub, extraerlo y abrir la terminal dentro de la carpeta.

### 3. Instalar dependencias

```powershell
npm install
```

### 4. Configurar e iniciar

```powershell
npm start
```

En el menú, elige:

```text
1. Configurar bot
```

Llena los datos solicitados, como idioma y nombre. Luego vuelve y elige:

```text
2. Iniciar bot
```

Usa QR Code o pairing code.

### 5. Iniciar la próxima vez

```powershell
npm run start:fast
```

</details>

<details>
<summary><strong>Tutorial Android</strong></summary>

Este tutorial usa Termux.

### 1. Instalar Termux

Instala Termux mediante F-Droid:

```text
https://f-droid.org/packages/com.termux/
```

Evita la versión antigua de la Play Store.

### 2. Actualizar paquetes

```bash
pkg update -y
pkg upgrade -y
```

### 3. Instalar Node.js y Git

```bash
pkg install -y nodejs git
```

Verifica:

```bash
node -v
npm -v
git --version
```

### 4. Descargar el proyecto

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

### 5. Instalar dependencias

```bash
npm install
```

### 6. Configurar e iniciar

```bash
npm start
```

Elige `Configurar bot`, llena los datos (incluyendo el idioma) y luego usa `Iniciar bot`.

Para pairing code, ingresa el número con código de país, por ejemplo:

```text
521234567890
```

### 7. Iniciar de nuevo

```bash
cd misa
npm run start:fast
```

</details>

<details>
<summary><strong>Tutorial VPS o Pterodactyl</strong></summary>

### 1. Requisitos

Usa un egg/imagen con:

- Node.js 22+
- npm
- Git, si vas a clonar directamente desde el repositorio

### 2. Subir o clonar los archivos

Vía terminal:

```bash
git clone https://github.com/hiudyy/misa.git .
```

O sube los archivos a través del gestor del panel.

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar

En la consola del panel:

```bash
npm start
```

Elige `Configurar bot`. Las preguntas (idioma, prefijo, API, etc.) aparecen en líneas separadas para mejorar la lectura en paneles como Pterodactyl.

### 5. Comando de inicialización

Usa:

```bash
npm run start:fast
```

Si aún no tienes una sesión, ejecuta primero `npm start` para configurar QR Code o pairing code.

### 6. Archivos importantes

- `src/config.json`: configuración principal
- `dados/misa-qr/`: sesión de WhatsApp
- `dados/grupos/`: configuraciones de los grupos
- `dados/owner/config.json`: configuraciones realizadas por el dueño vía bot

</details>
<br>
</details>
