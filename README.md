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

## Sobre

Misa é um bot modular em TypeScript criado pela [Cognima](https://cognima.com.br/urls).

Feita para ser simples de usar, fácil de manter e agradável de evoluir.

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

Depois volte e escolha:

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

Escolha `Configurar bot`, preencha os dados e depois use `Iniciar bot`.

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

Escolha `Configurar bot`. As perguntas aparecem em linhas separadas para melhorar a leitura em painéis como Pterodactyl.

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
