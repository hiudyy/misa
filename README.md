<div align="center">

<img src="src/assets/menu.jpeg" alt="Misa Bot" width="860" />

<br />

<a href="https://chat.whatsapp.com/IZRLPKgiDk6JLaNktVPE4M">
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp" />
</a>
<a href="https://discord.gg/HhfnR7BSnS">
  <img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
</a>

<br /><br />

<img src="https://count.getloli.com/@misa?name=misa&theme=miku&padding=7&offset=0&align=top&scale=1&pixelated=0&darkmode=auto" alt="Contador de visitas do projeto" />

</div>

<details>
<summary><h2>🇧🇷 Português (Brasil)</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** é um bot avançado e modular para **WhatsApp**, construído inteiramente em **TypeScript** com a biblioteca **Baileys** (Multi-Device).

Ela foi pensada para ser simples de instalar, fácil de manter e pronta para crescer com a sua comunidade. Com suporte nativo a internacionalização (i18n), a Misa já fala **Português, Inglês, Espanhol, Indonésio, Árabe, Francês, Hindi, Urdu, Alemão, Turco e Bengali**. Projeto criado pela [Cognima](https://cognima.com.br/urls).

## 🌐 Um bot realmente internacionalizado

A Misa não traduz só o menu. A proposta aqui é ter uma experiência multilíngue de verdade, do início ao fim.

- **Idiomas nativos:** suporte completo a **Português (PT)**, **Inglês (EN)**, **Espanhol (ES)**, **Indonésio (ID)**, **Árabe (AR)**, **Francês (FR)**, **Hindi (HI)**, **Urdu (UR)**, **Alemão (DE)**, **Turco (TR)** e **Bengali (BN)**.
- **Tradução completa:** terminal, mensagens de anti-link, logs internos, erros de API, fluxos de conexão e painéis interativos acompanham o idioma configurado.
- **Aliases dinâmicos:** os próprios comandos podem se adaptar ao idioma. Em vez de usar `!nomegp`, o usuário pode usar o alias equivalente no idioma ativo.
- **Idioma por grupo:** além do idioma global, cada grupo pode ter sua própria língua.

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
- Idioma do bot (`pt`, `es`, `en`, `id`, `ar`, `fr`, `hi`, `ur`, `de`, `tr`, `bn`)

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

Escolha `Configurar bot`. As perguntas (idioma, prefixo, API, etc.) aparecem em linhas separadas para melhorar a leitura em painéis como Pterodactyl.

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
<summary><h2>🇮🇳 हिन्दी</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** एक उन्नत और मॉड्यूलर **WhatsApp** बॉट है, जिसे पूरी तरह **TypeScript** और **Baileys** (Multi-Device) लाइब्रेरी के साथ बनाया गया है।

इसे इस तरह डिज़ाइन किया गया है कि इंस्टॉल करना आसान हो, संभालना आसान हो, और समुदाय बढ़ने पर भी यह आराम से स्केल कर सके। i18n सपोर्ट की वजह से Misa अब **Portuguese, English, Spanish, Indonesian, Arabic, French, Hindi, Urdu, German, Turkish और Bengali** में काम कर सकती है। यह प्रोजेक्ट [Cognima](https://cognima.com.br/urls) द्वारा बनाया गया है।

## 🌐 सच में बहुभाषी बॉट

Misa सिर्फ मेनू का अनुवाद नहीं करती। इसका लक्ष्य शुरू से अंत तक एक पूरा बहुभाषी अनुभव देना है।

- **मूल भाषाएँ:** **Portuguese (PT)**, **English (EN)**, **Spanish (ES)**, **Indonesian (ID)**, **Arabic (AR)**, **French (FR)**, **Hindi (HI)**, **Urdu (UR)**, **German (DE)**, **Turkish (TR)** और **Bengali (BN)** का पूरा समर्थन।
- **पूरा अनुवाद:** टर्मिनल अलर्ट, anti-link संदेश, आंतरिक लॉग्स, API errors, connection setup और interactive panels सब चुनी गई भाषा का पालन करते हैं।
- **डायनेमिक aliases:** कमांड के alias भी चुनी गई भाषा के अनुसार बदल सकते हैं।
- **प्रत्येक समूह के लिए अलग भाषा:** global भाषा के अलावा हर समूह अपनी अलग भाषा चुन सकता है।

## ट्यूटोरियल

<details>
<summary><strong>Linux ट्यूटोरियल</strong></summary>

### 1. Node.js इंस्टॉल करें

Node.js 22 या उससे ऊपर का संस्करण उपयोग करें।

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

जाँचें:

```bash
node -v
npm -v
```

### 2. प्रोजेक्ट डाउनलोड करें

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

अगर आपने ZIP डाउनलोड किया है, तो उसे extract करके प्रोजेक्ट फ़ोल्डर में जाएँ।

### 3. निर्भरताएँ इंस्टॉल करें

```bash
npm install
```

### 4. कॉन्फ़िगर करें

```bash
npm start
```

मेनू में `बॉट सेट करें` चुनें और यह जानकारी भरें:

- बॉट का नाम
- मालिक का नाम
- प्रीफ़िक्स
- देश कोड सहित मालिक का नंबर
- Misaka API key
- स्वचालित अपडेट
- बॉट की भाषा (`pt`, `es`, `en`, `id`, `ar`, `fr`, `hi`, `ur`, `de`, `tr`, `bn`)

### 5. शुरू करें

मेनू में:

```text
2. बॉट शुरू करें
```

उसके बाद QR Code या pairing code चुनें।

### 6. अगली बार सीधे चलाएँ

```bash
npm run start:fast
```

</details>

<details>
<summary><strong>Windows ट्यूटोरियल</strong></summary>

### 1. ज़रूरी प्रोग्राम इंस्टॉल करें

इंस्टॉल करें:

- Node.js 22 या उससे ऊपर: https://nodejs.org/
- Git: https://git-scm.com/

फिर PowerShell खोलकर जाँचें:

```powershell
node -v
npm -v
git --version
```

### 2. प्रोजेक्ट डाउनलोड करें

```powershell
git clone https://github.com/hiudyy/misa.git
cd misa
```

आप GitHub से ZIP डाउनलोड करके उसे extract भी कर सकते हैं, फिर उसी फ़ोल्डर में टर्मिनल खोलें।

### 3. निर्भरताएँ इंस्टॉल करें

```powershell
npm install
```

### 4. कॉन्फ़िगर और शुरू करें

```powershell
npm start
```

मेनू में चुनें:

```text
1. बॉट सेट करें
```

माँगी गई जानकारी भरें, जैसे भाषा और नाम। फिर वापस जाकर चुनें:

```text
2. बॉट शुरू करें
```

QR Code या pairing code का उपयोग करें।

### 5. अगली बार शुरू करना

```powershell
npm run start:fast
```

</details>

<details>
<summary><strong>Android ट्यूटोरियल</strong></summary>

यह ट्यूटोरियल Termux का उपयोग करता है।

### 1. Termux इंस्टॉल करें

Termux को F-Droid से इंस्टॉल करें:

```text
https://f-droid.org/packages/com.termux/
```

Play Store वाली पुरानी version से बचें।

### 2. Packages अपडेट करें

```bash
pkg update -y
pkg upgrade -y
```

### 3. Node.js और Git इंस्टॉल करें

```bash
pkg install -y nodejs git
```

जाँचें:

```bash
node -v
npm -v
git --version
```

### 4. प्रोजेक्ट डाउनलोड करें

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

### 5. निर्भरताएँ इंस्टॉल करें

```bash
npm install
```

### 6. कॉन्फ़िगर और शुरू करें

```bash
npm start
```

`बॉट सेट करें` चुनें, जानकारी भरें, फिर `बॉट शुरू करें` का उपयोग करें।

Pairing code के लिए देश कोड सहित नंबर दर्ज करें, उदाहरण:

```text
919876543210
```

### 7. दोबारा शुरू करें

```bash
cd misa
npm run start:fast
```

</details>

<details>
<summary><strong>VPS या Pterodactyl ट्यूटोरियल</strong></summary>

### 1. आवश्यकताएँ

ऐसी image/egg उपयोग करें जिसमें ये हों:

- Node.js 22+
- npm
- Git, अगर आप सीधे repository clone करना चाहते हैं

### 2. फ़ाइलें अपलोड या clone करें

Terminal के जरिए:

```bash
git clone https://github.com/hiudyy/misa.git .
```

या panel manager के जरिए फ़ाइलें अपलोड करें।

### 3. निर्भरताएँ इंस्टॉल करें

```bash
npm install
```

### 4. कॉन्फ़िगर करें

पैनल कंसोल में:

```bash
npm start
```

`बॉट सेट करें` चुनें। भाषा, prefix, API आदि से जुड़े सवाल अलग-अलग लाइनों में दिखेंगे, जिससे Pterodactyl जैसे panels में पढ़ना आसान हो जाता है।

### 5. स्टार्टअप कमांड

उपयोग करें:

```bash
npm run start:fast
```

अगर अभी तक सत्र नहीं है, तो पहले `npm start` चलाकर QR Code या pairing code सेट करें।

### 6. महत्वपूर्ण फ़ाइलें

- `src/config.json`: मुख्य कॉन्फ़िगरेशन
- `dados/misa-qr/`: WhatsApp सत्र
- `dados/grupos/`: ग्रुप कॉन्फ़िगरेशन
- `dados/owner/config.json`: मालिक द्वारा बॉट के अंदर से बदली गई सेटिंग्स

</details>
<br>
</details>

<details>
<summary><h2>🇵🇰 اردو</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** ایک جدید اور ماڈیولر **WhatsApp** بوٹ ہے، جسے مکمل طور پر **TypeScript** اور **Baileys** (Multi-Device) لائبریری کے ساتھ بنایا گیا ہے۔

اسے اس طرح ڈیزائن کیا گیا ہے کہ انسٹال کرنا آسان ہو، سنبھالنا آسان ہو، اور کمیونٹی کے بڑھنے کے ساتھ آرام سے اسکیل کر سکے۔ i18n سپورٹ کی وجہ سے Misa اب **Portuguese, English, Spanish, Indonesian, Arabic, French, Hindi, Urdu, German, Turkish اور Bengali** میں کام کر سکتی ہے۔ یہ پروجیکٹ [Cognima](https://cognima.com.br/urls) نے بنایا ہے۔

## 🌐 واقعی کثیر لسانی بوٹ

Misa صرف مینو کا ترجمہ نہیں کرتی۔ اس کا مقصد شروع سے آخر تک مکمل کثیر لسانی تجربہ دینا ہے۔

- **اصل زبانیں:** **Portuguese (PT)**، **English (EN)**، **Spanish (ES)**، **Indonesian (ID)**، **Arabic (AR)**، **French (FR)**، **Hindi (HI)**، **Urdu (UR)**، **German (DE)**، **Turkish (TR)** اور **Bengali (BN)** کا مکمل سپورٹ۔
- **مکمل ترجمہ:** ٹرمینل alerts، anti-link پیغامات، اندرونی logs، API errors، connection setup اور interactive panels سب منتخب زبان کے مطابق ہوتے ہیں۔
- **ڈائنامک aliases:** کمانڈ alias بھی منتخب زبان کے مطابق بدل سکتے ہیں۔
- **ہر گروپ کے لیے الگ زبان:** global زبان کے علاوہ ہر گروپ اپنی الگ زبان رکھ سکتا ہے۔

## ٹیوٹوریلز

<details>
<summary><strong>Linux ٹیوٹوریل</strong></summary>

### 1. Node.js انسٹال کریں

Node.js 22 یا اس سے اوپر کا ورژن استعمال کریں۔

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

چیک کریں:

```bash
node -v
npm -v
```

### 2. پروجیکٹ ڈاؤن لوڈ کریں

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

اگر آپ نے ZIP ڈاؤن لوڈ کیا ہے تو اسے extract کریں اور پروجیکٹ فولڈر میں جائیں۔

### 3. انحصارات انسٹال کریں

```bash
npm install
```

### 4. ترتیب دیں

```bash
npm start
```

مینو میں `بوٹ سیٹ کریں` منتخب کریں اور یہ معلومات درج کریں:

- بوٹ کا نام
- مالک کا نام
- پریفکس
- ملک کے کوڈ کے ساتھ مالک کا نمبر
- Misaka API key
- خودکار اپ ڈیٹ
- بوٹ کی زبان (`pt`, `es`, `en`, `id`, `ar`, `fr`, `hi`, `ur`, `de`, `tr`, `bn`)

### 5. شروع کریں

مینو میں:

```text
2. بوٹ شروع کریں
```

اس کے بعد QR Code یا pairing code منتخب کریں۔

### 6. اگلی بار براہ راست چلائیں

```bash
npm run start:fast
```

</details>

<details>
<summary><strong>Windows ٹیوٹوریل</strong></summary>

### 1. ضروری پروگرام انسٹال کریں

انسٹال کریں:

- Node.js 22 یا اس سے اوپر: https://nodejs.org/
- Git: https://git-scm.com/

پھر PowerShell کھول کر چیک کریں:

```powershell
node -v
npm -v
git --version
```

### 2. پروجیکٹ ڈاؤن لوڈ کریں

```powershell
git clone https://github.com/hiudyy/misa.git
cd misa
```

آپ GitHub سے ZIP ڈاؤن لوڈ کرکے اسے extract بھی کر سکتے ہیں، پھر اسی فولڈر میں ٹرمینل کھولیں۔

### 3. انحصارات انسٹال کریں

```powershell
npm install
```

### 4. ترتیب دیں اور شروع کریں

```powershell
npm start
```

مینو میں منتخب کریں:

```text
1. بوٹ سیٹ کریں
```

مطلوبہ معلومات درج کریں، جیسے زبان اور نام۔ پھر واپس جا کر منتخب کریں:

```text
2. بوٹ شروع کریں
```

QR Code یا pairing code استعمال کریں۔

### 5. اگلی بار شروع کرنا

```powershell
npm run start:fast
```

</details>

<details>
<summary><strong>Android ٹیوٹوریل</strong></summary>

یہ ٹیوٹوریل Termux استعمال کرتا ہے۔

### 1. Termux انسٹال کریں

Termux کو F-Droid سے انسٹال کریں:

```text
https://f-droid.org/packages/com.termux/
```

Play Store والی پرانی version سے بچیں۔

### 2. Packages اپڈیٹ کریں

```bash
pkg update -y
pkg upgrade -y
```

### 3. Node.js اور Git انسٹال کریں

```bash
pkg install -y nodejs git
```

چیک کریں:

```bash
node -v
npm -v
git --version
```

### 4. پروجیکٹ ڈاؤن لوڈ کریں

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

### 5. انحصارات انسٹال کریں

```bash
npm install
```

### 6. ترتیب دیں اور شروع کریں

```bash
npm start
```

`بوٹ سیٹ کریں` منتخب کریں، معلومات درج کریں، پھر `بوٹ شروع کریں` استعمال کریں۔

Pairing code کے لیے ملک کے کوڈ کے ساتھ نمبر درج کریں، مثال:

```text
923001234567
```

### 7. دوبارہ شروع کریں

```bash
cd misa
npm run start:fast
```

</details>

<details>
<summary><strong>VPS یا Pterodactyl ٹیوٹوریل</strong></summary>

### 1. ضروریات

ایسی image/egg استعمال کریں جس میں یہ ہوں:

- Node.js 22+
- npm
- Git، اگر آپ repository براہ راست clone کرنا چاہتے ہیں

### 2. فائلیں اپلوڈ یا clone کریں

Terminal کے ذریعے:

```bash
git clone https://github.com/hiudyy/misa.git .
```

یا panel manager کے ذریعے فائلیں اپلوڈ کریں۔

### 3. انحصارات انسٹال کریں

```bash
npm install
```

### 4. ترتیب دیں

پینل کنسول میں:

```bash
npm start
```

`بوٹ سیٹ کریں` منتخب کریں۔ زبان، prefix، API وغیرہ کے سوالات الگ الگ لائنوں میں نظر آئیں گے، جس سے Pterodactyl جیسے panels میں پڑھنا آسان ہو جاتا ہے۔

### 5. اسٹارٹ اپ کمانڈ

استعمال کریں:

```bash
npm run start:fast
```

اگر ابھی تک سیشن نہیں ہے تو پہلے `npm start` چلا کر QR Code یا pairing code سیٹ کریں۔

### 6. اہم فائلیں

- `src/config.json`: مرکزی کنفیگریشن
- `dados/misa-qr/`: WhatsApp سیشن
- `dados/grupos/`: گروپ کنفیگریشنز
- `dados/owner/config.json`: owner کی طرف سے bot کے اندر سے بدلی گئی سیٹنگز

</details>
<br>
</details>

<details>
<summary><h2>🇺🇸 English</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** is an advanced and modular **WhatsApp** bot built entirely in **TypeScript** with the **Baileys** (Multi-Device) library.

It was designed to be easy to install, easy to maintain, and ready to scale with your community. With native internationalization (i18n), Misa already supports **Portuguese, English, Spanish, Indonesian, Arabic, French, Hindi, Urdu, German, Turkish, and Bengali**. Created by [Cognima](https://cognima.com.br/urls).

## 🌐 A truly internationalized bot

Misa does not just translate the menu. The goal is to deliver a fully multilingual experience from end to end.

- **Native languages:** full support for **Portuguese (PT)**, **English (EN)**, **Spanish (ES)**, **Indonesian (ID)**, **Arabic (AR)**, **French (FR)**, **Hindi (HI)**, **Urdu (UR)**, **German (DE)**, **Turkish (TR)**, and **Bengali (BN)**.
- **Complete translation:** terminal alerts, anti-link messages, internal logs, API errors, connection setup flows, and interactive panels all follow the configured language.
- **Dynamic aliases:** command aliases can adapt to the selected language too.
- **Per-group language:** besides the global language, each group can define its own language.

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
- Bot language (`pt`, `es`, `en`, `id`, `ar`, `fr`, `hi`, `ur`, `de`, `tr`, `bn`)

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

Choose `Configure bot`, fill in the data (including the language), and then use `Start bot`.

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

Choose `Configure bot`. The questions (language, prefix, API, etc.) appear on separate lines for better readability in panels such as Pterodactyl.

### 5. Startup command

Use:

```bash
npm run start:fast
```

If you still do not have a session, run `npm start` first to configure QR Code or pairing code.

### 6. Important files

- `src/config.json`: main configuration
- `dados/misa-qr/`: WhatsApp session
- `dados/grupos/`: group configurations
- `dados/owner/config.json`: configurations made by the owner through the bot

</details>
<br>
</details>

<details>
<summary><h2>🇪🇸 Español</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** es un bot avanzado y modular para **WhatsApp**, construido completamente en **TypeScript** con la biblioteca **Baileys** (Multi-Device).

Está diseñado para ser fácil de instalar, fácil de mantener y listo para crecer junto con tu comunidad. Con soporte nativo de internacionalización (i18n), Misa ya habla **Portugués, Inglés, Español, Indonesio, Árabe, Francés, Hindi, Urdu, Alemán, Turco y Bengalí**. Creado por [Cognima](https://cognima.com.br/urls).

## 🌐 Un bot realmente internacionalizado

Misa no se limita a traducir el menú. La idea es ofrecer una experiencia multilingüe de verdad, de principio a fin.

- **Idiomas nativos:** soporte completo para **Portugués (PT)**, **Inglés (EN)**, **Español (ES)**, **Indonesio (ID)**, **Árabe (AR)**, **Francés (FR)**, **Hindi (HI)**, **Urdu (UR)**, **Alemán (DE)**, **Turco (TR)** y **Bengalí (BN)**.
- **Traducción completa:** alertas de terminal, mensajes de anti-link, logs internos, errores de API, flujos de conexión y paneles interactivos siguen el idioma configurado.
- **Alias dinámicos:** los alias de los comandos también pueden adaptarse al idioma seleccionado.
- **Idioma por grupo:** además del idioma global, cada grupo puede tener su propio idioma.

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

Elige `Configurar bot` y completa:

- Nombre del bot
- Nombre del dueño
- Prefijo
- Número del dueño con código de país
- API key de Misaka
- Actualización automática
- Idioma del bot (`pt`, `es`, `en`, `id`, `ar`, `fr`)

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

Completa los datos solicitados, como idioma y nombre. Luego vuelve y elige:

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

Elige `Configurar bot`, completa los datos (incluido el idioma) y luego usa `Iniciar bot`.

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

Si todavía no tienes una sesión, ejecuta primero `npm start` para configurar QR Code o pairing code.

### 6. Archivos importantes

- `src/config.json`: configuración principal
- `dados/misa-qr/`: sesión de WhatsApp
- `dados/grupos/`: configuraciones de los grupos
- `dados/owner/config.json`: configuraciones realizadas por el dueño a través del bot

</details>
<br>
</details>

<details>
<summary><h2>🇮🇩 Bahasa Indonesia</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** adalah bot canggih dan modular untuk **WhatsApp**, dibangun sepenuhnya dengan **TypeScript** menggunakan library **Baileys** (Multi-Device).

Bot ini dirancang agar mudah dipasang, mudah dipelihara, dan siap berkembang bersama komunitas Anda. Dengan dukungan internasionalisasi (i18n) bawaan, Misa sudah mendukung **Portugis, Inggris, Spanyol, Indonesia, Arab, Prancis, Hindi, Urdu, Jerman, Turki, dan Bengali**. Dibuat oleh [Cognima](https://cognima.com.br/urls).

## 🌐 Bot yang benar-benar terinternasionalisasi

Misa tidak hanya menerjemahkan menu. Tujuannya adalah memberikan pengalaman multibahasa yang utuh dari awal sampai akhir.

- **Bahasa native:** dukungan penuh untuk **Portugis (PT)**, **Inggris (EN)**, **Spanyol (ES)**, **Indonesia (ID)**, **Arab (AR)**, dan **Prancis (FR)**.
- **Terjemahan lengkap:** pesan terminal, anti-link, log internal, error API, alur koneksi, dan panel interaktif mengikuti bahasa yang dipilih.
- **Alias dinamis:** alias perintah juga bisa menyesuaikan dengan bahasa aktif.
- **Bahasa per grup:** selain bahasa global, setiap grup juga bisa punya bahasanya sendiri.

## Tutorial

<details>
<summary><strong>Tutorial Linux</strong></summary>

### 1. Instal Node.js

Gunakan Node.js versi 22 atau lebih tinggi.

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifikasi:

```bash
node -v
npm -v
```

### 2. Unduh proyek

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

Jika Anda mengunduh ZIP, ekstrak dan masuk ke folder proyek.

### 3. Instal dependensi

```bash
npm install
```

### 4. Konfigurasi

```bash
npm start
```

Pilih `Konfigurasi bot` dan isi:

- Nama bot
- Nama pemilik
- Prefiks
- Nomor pemilik dengan kode negara
- Kunci API Misaka
- Pembaruan otomatis
- Bahasa bot (`pt`, `es`, `en`, `id`, `ar`, `fr`)

### 5. Mulai

Masih di menu:

```text
2. Mulai bot
```

Kemudian pilih QR Code atau kode pairing.

### 6. Jalankan langsung

Setelah konfigurasi pertama:

```bash
npm run start:fast
```

</details>

<details>
<summary><strong>Tutorial Windows</strong></summary>

### 1. Instal program yang diperlukan

Instal:

- Node.js 22 atau lebih tinggi: https://nodejs.org/
- Git: https://git-scm.com/

Kemudian buka PowerShell dan verifikasi:

```powershell
node -v
npm -v
git --version
```

### 2. Unduh proyek

```powershell
git clone https://github.com/hiudyy/misa.git
cd misa
```

Anda juga bisa mengunduh ZIP dari GitHub, mengekstraknya, dan membuka terminal di dalam folder tersebut.

### 3. Instal dependensi

```powershell
npm install
```

### 4. Konfigurasi dan mulai

```powershell
npm start
```

Di menu, pilih:

```text
1. Konfigurasi bot
```

Isi data yang diminta, seperti bahasa dan nama. Kemudian kembali dan pilih:

```text
2. Mulai bot
```

Gunakan QR Code atau kode pairing.

### 5. Mulai di lain waktu

```powershell
npm run start:fast
```

</details>

<details>
<summary><strong>Tutorial Android</strong></summary>

Tutorial ini menggunakan Termux.

### 1. Instal Termux

Instal Termux melalui F-Droid:

```text
https://f-droid.org/packages/com.termux/
```

Hindari versi lama dari Play Store.

### 2. Perbarui paket

```bash
pkg update -y
pkg upgrade -y
```

### 3. Instal Node.js dan Git

```bash
pkg install -y nodejs git
```

Verifikasi:

```bash
node -v
npm -v
git --version
```

### 4. Unduh proyek

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

### 5. Instal dependensi

```bash
npm install
```

### 6. Konfigurasi dan mulai

```bash
npm start
```

Pilih `Konfigurasi bot`, isi data (termasuk bahasa), lalu gunakan `Mulai bot`.

Untuk kode pairing, masukkan nomor dengan kode negara, contohnya:

```text
6281234567890
```

### 7. Mulai kembali

```bash
cd misa
npm run start:fast
```

</details>

<details>
<summary><strong>Tutorial VPS atau Pterodactyl</strong></summary>

### 1. Persyaratan

Gunakan egg/image dengan:

- Node.js 22+
- npm
- Git, jika Anda ingin meng-clone langsung dari repositori

### 2. Unggah atau clone file

Melalui terminal:

```bash
git clone https://github.com/hiudyy/misa.git .
```

Atau unggah file melalui pengelola panel.

### 3. Instal dependensi

```bash
npm install
```

### 4. Konfigurasi

Di konsol panel:

```bash
npm start
```

Pilih `Konfigurasi bot`. Pertanyaan konfigurasi (bahasa, prefiks, API, dll.) akan muncul di baris terpisah agar lebih mudah dibaca di panel seperti Pterodactyl.

### 5. Perintah startup

Gunakan:

```bash
npm run start:fast
```

Jika Anda belum memiliki sesi, jalankan `npm start` terlebih dahulu untuk mengatur QR Code atau kode pairing.

### 6. File penting

- `src/config.json`: konfigurasi utama
- `dados/misa-qr/`: sesi WhatsApp
- `dados/grupos/`: konfigurasi grup
- `dados/owner/config.json`: konfigurasi yang dilakukan pemilik melalui bot

</details>
<br>
</details>

<details>
<summary><h2>🇫🇷 Français</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** est un bot **WhatsApp** avancé et modulaire, développé entièrement en **TypeScript** avec la bibliothèque **Baileys** (Multi-Device).

Il a été conçu pour être simple à installer, facile à maintenir et prêt à évoluer avec votre communauté. Grâce à son système natif d'internationalisation (i18n), Misa prend déjà en charge le **portugais, l'anglais, l'espagnol, l'indonésien, l'arabe et le français**. Créé par [Cognima](https://cognima.com.br/urls).

## 🌐 Un bot vraiment internationalisé

Misa ne se contente pas de traduire le menu. L'objectif est d'offrir une expérience multilingue cohérente d'un bout à l'autre du projet.

- **Langues natives :** prise en charge complète du **portugais (PT)**, de l'**anglais (EN)**, de l'**espagnol (ES)**, de l'**indonésien (ID)**, de l'**arabe (AR)** et du **français (FR)**.
- **Traduction complète :** alertes du terminal, messages anti-lien, journaux internes, erreurs API, étapes de connexion et panneaux interactifs suivent la langue configurée.
- **Alias dynamiques :** les alias de commandes peuvent eux aussi s'adapter à la langue choisie.
- **Langue par groupe :** en plus de la langue globale, chaque groupe peut définir sa propre langue.

## Tutoriels

<details>
<summary><strong>Tutoriel Linux</strong></summary>

### 1. Installer Node.js

Utilisez Node.js 22 ou supérieur.

Ubuntu/Debian :

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Vérifiez :

```bash
node -v
npm -v
```

### 2. Télécharger le projet

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

Si vous avez téléchargé le ZIP, extrayez-le puis entrez dans le dossier du projet.

### 3. Installer les dépendances

```bash
npm install
```

### 4. Configurer

```bash
npm start
```

Choisissez l'option de configuration du bot et remplissez :

- Nom du bot
- Nom du propriétaire
- Préfixe
- Numéro du propriétaire avec indicatif pays
- Clé API Misaka
- Mise à jour automatique
- Langue du bot (`pt`, `es`, `en`, `id`, `ar`, `fr`)

### 5. Démarrer

Dans le menu :

```text
2. Démarrer le bot
```

Choisissez ensuite entre un QR Code et un code d'appairage.

### 6. Lancer directement

Après la première configuration :

```bash
npm run start:fast
```

</details>

<details>
<summary><strong>Tutoriel Windows</strong></summary>

### 1. Installer les programmes

Installez :

- Node.js 22 ou supérieur : https://nodejs.org/
- Git : https://git-scm.com/

Ensuite, ouvrez PowerShell et vérifiez :

```powershell
node -v
npm -v
git --version
```

### 2. Télécharger le projet

```powershell
git clone https://github.com/hiudyy/misa.git
cd misa
```

Vous pouvez aussi télécharger le ZIP depuis GitHub, l'extraire et ouvrir le terminal dans le dossier.

### 3. Installer les dépendances

```powershell
npm install
```

### 4. Configurer et démarrer

```powershell
npm start
```

Dans le menu, choisissez :

```text
1. Configurer le bot
```

Renseignez les informations demandées, comme la langue et le nom. Revenez ensuite en arrière et choisissez :

```text
2. Démarrer le bot
```

Utilisez un QR Code ou un code d'appairage.

### 5. Démarrer les prochaines fois

```powershell
npm run start:fast
```

</details>

<details>
<summary><strong>Tutoriel Android</strong></summary>

Ce tutoriel utilise Termux.

### 1. Installer Termux

Installez Termux via F-Droid :

```text
https://f-droid.org/packages/com.termux/
```

Évitez l'ancienne version du Play Store.

### 2. Mettre à jour les paquets

```bash
pkg update -y
pkg upgrade -y
```

### 3. Installer Node.js et Git

```bash
pkg install -y nodejs git
```

Vérifiez :

```bash
node -v
npm -v
git --version
```

### 4. Télécharger le projet

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

### 5. Installer les dépendances

```bash
npm install
```

### 6. Configurer et démarrer

```bash
npm start
```

Choisissez l'option de configuration du bot, remplissez les informations demandées, puis utilisez `Démarrer le bot`.

Pour le code d'appairage, saisissez le numéro avec indicatif pays, par exemple :

```text
33612345678
```

### 7. Relancer ensuite

```bash
cd misa
npm run start:fast
```

</details>

<details>
<summary><strong>Tutoriel VPS ou Pterodactyl</strong></summary>

### 1. Prérequis

Utilisez une image ou une egg avec :

- Node.js 22+
- npm
- Git, si vous clonez directement le dépôt

### 2. Envoyer ou cloner les fichiers

Via terminal :

```bash
git clone https://github.com/hiudyy/misa.git .
```

Ou envoyez les fichiers depuis le gestionnaire du panneau.

### 3. Installer les dépendances

```bash
npm install
```

### 4. Configurer

Dans la console du panneau :

```bash
npm start
```

Choisissez l'option de configuration du bot. Les questions (langue, préfixe, API, etc.) apparaissent sur des lignes séparées pour être plus lisibles sur des panneaux comme Pterodactyl.

### 5. Commande de démarrage

Utilisez :

```bash
npm run start:fast
```

Si vous n'avez pas encore de session, lancez d'abord `npm start` pour configurer le QR Code ou le code d'appairage.

### 6. Fichiers importants

- `src/config.json` : configuration principale
- `dados/misa-qr/` : session WhatsApp
- `dados/grupos/` : configurations des groupes
- `dados/owner/config.json` : configurations effectuées par le propriétaire via le bot

</details>
<br>
</details>

<details>
<summary><h2>🇸🇦 العربية</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** هو بوت **WhatsApp** متقدم ومرن، مبني بالكامل باستخدام **TypeScript** ومكتبة **Baileys** (Multi-Device).

تم تصميمه ليكون سهل التثبيت وسهل الصيانة وقابلا للتوسع مع نمو مجتمعك. بفضل دعم التدويل (i18n) المدمج، يدعم Misa حاليا **البرتغالية والإنجليزية والإسبانية والإندونيسية والعربية والفرنسية والهندية والأردية والألمانية والتركية والبنغالية**. المشروع من تطوير [Cognima](https://cognima.com.br/urls).

## 🌐 بوت متعدد اللغات بشكل حقيقي

Misa لا يترجم القائمة فقط، بل يقدّم تجربة متعددة اللغات من البداية إلى النهاية.

- **اللغات المدعومة أصلا:** دعم كامل لـ **البرتغالية (PT)** و**الإنجليزية (EN)** و**الإسبانية (ES)** و**الإندونيسية (ID)** و**العربية (AR)** و**الفرنسية (FR)** و**الهندية (HI)** و**الأردية (UR)** و**الألمانية (DE)** و**التركية (TR)** و**البنغالية (BN)**.
- **ترجمة كاملة:** تنبيهات الطرفية، ورسائل منع الروابط، والسجلات الداخلية، وأخطاء API، وخطوات الاتصال، واللوحات التفاعلية تتبع اللغة المختارة.
- **أسماء بديلة ديناميكية:** يمكن أيضا لأسماء الأوامر البديلة أن تتكيف مع اللغة النشطة.
- **لغة مستقلة لكل مجموعة:** بالإضافة إلى اللغة العامة، يمكن لكل مجموعة تحديد لغتها الخاصة.

## الشروحات

<details>
<summary><strong>شرح Linux</strong></summary>

### 1. تثبيت Node.js

استخدم Node.js 22 أو أحدث.

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

تحقق من التثبيت:

```bash
node -v
npm -v
```

### 2. تحميل المشروع

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

إذا قمت بتنزيل الملف بصيغة ZIP، فك الضغط ثم ادخل إلى مجلد المشروع.

### 3. تثبيت الاعتماديات

```bash
npm install
```

### 4. الإعداد

```bash
npm start
```

اختر `إعداد البوت` ثم أدخل:

- اسم البوت
- اسم المالك
- البادئة
- رقم المالك مع كود الدولة
- مفتاح API الخاص بـ Misaka
- التحديث التلقائي
- لغة البوت (`pt`, `es`, `en`, `id`, `ar`, `fr`, `hi`, `ur`, `de`, `tr`, `bn`)

### 5. التشغيل

من القائمة:

```text
2. تشغيل البوت
```

بعد ذلك اختر بين QR Code أو رمز الربط.

### 6. تشغيل مباشر

بعد أول إعداد:

```bash
npm run start:fast
```

</details>

<details>
<summary><strong>شرح Windows</strong></summary>

### 1. تثبيت البرامج

قم بتثبيت:

- Node.js 22 أو أحدث: https://nodejs.org/
- Git: https://git-scm.com/

ثم افتح PowerShell وتحقق:

```powershell
node -v
npm -v
git --version
```

### 2. تحميل المشروع

```powershell
git clone https://github.com/hiudyy/misa.git
cd misa
```

يمكنك أيضا تنزيل ZIP من GitHub، ثم فك الضغط وفتح الطرفية داخل المجلد.

### 3. تثبيت الاعتماديات

```powershell
npm install
```

### 4. الإعداد والتشغيل

```powershell
npm start
```

من القائمة اختر:

```text
1. إعداد البوت
```

أدخل البيانات المطلوبة مثل اللغة والاسم، ثم ارجع واختر:

```text
2. تشغيل البوت
```

استخدم QR Code أو رمز الربط.

### 5. التشغيل في المرات القادمة

```powershell
npm run start:fast
```

</details>

<details>
<summary><strong>شرح Android</strong></summary>

هذا الشرح يعتمد على Termux.

### 1. تثبيت Termux

قم بتثبيت Termux عبر F-Droid:

```text
https://f-droid.org/packages/com.termux/
```

تجنب النسخة القديمة من Play Store.

### 2. تحديث الحزم

```bash
pkg update -y
pkg upgrade -y
```

### 3. تثبيت Node.js وGit

```bash
pkg install -y nodejs git
```

تحقق:

```bash
node -v
npm -v
git --version
```

### 4. تحميل المشروع

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

### 5. تثبيت الاعتماديات

```bash
npm install
```

### 6. الإعداد والتشغيل

```bash
npm start
```

اختر `إعداد البوت`، ثم أدخل البيانات المطلوبة، وبعدها استخدم `تشغيل البوت`.

بالنسبة إلى رمز الربط، أدخل الرقم مع كود الدولة، مثلا:

```text
201001234567
```

### 7. التشغيل مرة أخرى

```bash
cd misa
npm run start:fast
```

</details>

<details>
<summary><strong>شرح VPS أو Pterodactyl</strong></summary>

### 1. المتطلبات

استخدم صورة أو egg تحتوي على:

- Node.js 22+
- npm
- Git إذا كنت ستقوم بعمل clone مباشرة من المستودع

### 2. رفع الملفات أو عمل clone

عبر الطرفية:

```bash
git clone https://github.com/hiudyy/misa.git .
```

أو ارفع الملفات من خلال مدير الملفات في اللوحة.

### 3. تثبيت الاعتماديات

```bash
npm install
```

### 4. الإعداد

في الـ console الخاصة باللوحة:

```bash
npm start
```

اختر `إعداد البوت`. ستظهر أسئلة الإعداد مثل اللغة والبادئة وAPI وغيرها في أسطر منفصلة لتكون القراءة أوضح داخل لوحات مثل Pterodactyl.

### 5. أمر التشغيل

استخدم:

```bash
npm run start:fast
```

إذا لم تكن لديك جلسة بعد، شغّل `npm start` أولا لإعداد QR Code أو رمز الربط.

### 6. الملفات المهمة

- `src/config.json`: الإعداد الرئيسي
- `dados/misa-qr/`: جلسة WhatsApp
- `dados/grupos/`: إعدادات المجموعات
- `dados/owner/config.json`: الإعدادات التي يجريها المالك عبر البوت

</details>
<br>
</details>

<details>
<summary><h2>🇩🇪 Deutsch</h2></summary>

# Misa Bot – WhatsApp Multi-Device 🤖

**Misa** ist ein fortschrittlicher und modularer **WhatsApp**-Bot, der vollständig in **TypeScript** mit der Bibliothek **Baileys** (Multi-Device) entwickelt wurde.

Misa wurde so entwickelt, dass Installation und Wartung unkompliziert bleiben und der Bot mit Ihrer Community mitwachsen kann. Dank nativer Internationalisierung (i18n) unterstützt Misa bereits **Portugiesisch, Englisch, Spanisch, Indonesisch, Arabisch, Französisch, Hindi, Urdu, Deutsch, Türkisch und Bengalisch**. Entwickelt von [Cognima](https://cognima.com.br/urls).

## 🌐 Ein wirklich internationalisierter Bot

Misa übersetzt nicht nur das Menü. Ziel ist ein wirklich durchgängiges mehrsprachiges Erlebnis.

- **Nativ unterstützte Sprachen:** volle Unterstützung für **Portugiesisch (PT)**, **Englisch (EN)**, **Spanisch (ES)**, **Indonesisch (ID)**, **Arabisch (AR)**, **Französisch (FR)**, **Hindi (HI)**, **Urdu (UR)**, **Deutsch (DE)**, **Türkisch (TR)** und **Bengalisch (BN)**.
- **Vollständige Übersetzung:** Terminalhinweise, Anti-Link-Nachrichten, interne Logs, API-Fehler, Verbindungsabläufe und interaktive Panels folgen der eingestellten Sprache.
- **Dynamische Aliase:** Auch Befehlsaliase passen sich automatisch an die aktive Sprache an.
- **Sprache pro Gruppe:** Zusätzlich zur globalen Sprache kann jede Gruppe eine eigene Sprache festlegen.

## Tutorials

<details>
<summary><strong>Linux-Tutorial</strong></summary>

### 1. Installieren Sie Node.js

Verwenden Sie Node.js 22 oder höher.

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Überprüfen Sie:

```bash
node -v
npm -v
```

### 2. Laden Sie das Projekt herunter

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

Wenn Sie die ZIP-Datei heruntergeladen haben, extrahieren Sie sie und geben Sie den Projektordner ein.

### 3. Abhängigkeiten installieren

```bash
npm install
```

### 4. Konfigurieren

```bash
npm start
```

Wählen Sie `Bot konfigurieren` und tragen Sie Folgendes ein:

- Bot-Name
- Name des Besitzers
- Präfix
- Besitzernummer mit Ländercode
- Misaka-API-Schlüssel
- Automatische Aktualisierung
- Bot-Sprache (`pt`, `es`, `en`, `id`, `ar`, `fr`, `hi`, `ur`, `de`, `tr`, `bn`)

### 5. Starten

Noch im Menü:

```text
2. Bot starten
```

Wählen Sie dann QR-Code oder Pairing-Code.

### 6. Direkt ausführen

Nach der ersten Konfiguration:

```bash
npm run start:fast
```

</details>

<details>
<summary><strong>Windows-Tutorial</strong></summary>

### 1. Installieren Sie die Programme

Installieren:

- Node.js 22 oder höher: https://nodejs.org/
- Git: https://git-scm.com/

Öffnen Sie dann PowerShell und überprüfen Sie Folgendes:

```powershell
node -v
npm -v
git --version
```

### 2. Laden Sie das Projekt herunter

```powershell
git clone https://github.com/hiudyy/misa.git
cd misa
```

Sie können die ZIP-Datei auch von GitHub herunterladen, entpacken und das Terminal im Ordner öffnen.

### 3. Abhängigkeiten installieren

```powershell
npm install
```

### 4. Konfigurieren und starten

```powershell
npm start
```

Wählen Sie im Menü:

```text
1. Bot konfigurieren
```

Geben Sie die abgefragten Daten wie Sprache und Name ein. Gehen Sie dann zurück und wählen Sie:

```text
2. Bot starten
```

Verwenden Sie QR-Code oder Pairing-Code.

### 5. Beginnen Sie das nächste Mal

```powershell
npm run start:fast
```

</details>

<details>
<summary><strong>Android-Tutorial</strong></summary>

Dieses Tutorial verwendet Termux.

### 1. Termux installieren

Installieren Sie Termux über F-Droid:

```text
https://f-droid.org/packages/com.termux/
```

Vermeiden Sie die alte Version aus dem Play Store.

### 2. Pakete aktualisieren

```bash
pkg update -y
pkg upgrade -y
```

### 3. Installieren Sie Node.js und Git

```bash
pkg install -y nodejs git
```

Überprüfen Sie:

```bash
node -v
npm -v
git --version
```

### 4. Laden Sie das Projekt herunter

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

### 5. Abhängigkeiten installieren

```bash
npm install
```

### 6. Konfigurieren und starten

```bash
npm start
```

Wählen Sie `Bot konfigurieren`, füllen Sie die Angaben aus (einschließlich der Sprache) und starten Sie danach mit `Bot starten`.

Geben Sie als Kopplungscode die Nummer mit Ländercode ein, zum Beispiel:

```text
1234567890
```

### 7. Beginnen Sie erneut

```bash
cd misa
npm run start:fast
```

</details>

<details>
<summary><strong>VPS- oder Pterodactyl-Tutorial</strong></summary>

### 1. Anforderungen

Verwenden Sie ein Image/Egg mit:

- Node.js 22+
- npm
- Git, wenn direkt aus dem Repository geklont wird

### 2. Laden Sie die Dateien hoch oder klonen Sie sie

Über Terminal:

```bash
git clone https://github.com/hiudyy/misa.git .
```

Oder laden Sie die Dateien über den Panel-Manager hoch.

### 3. Abhängigkeiten installieren

```bash
npm install
```

### 4. Konfigurieren

In der Panel-Konsole:

```bash
npm start
```

Wählen Sie `Bot konfigurieren`. Die Fragen zu Sprache, Präfix, API usw. erscheinen jeweils in einer eigenen Zeile, damit sie sich in Panels wie Pterodactyl besser lesen lassen.

### 5. Startbefehl

Verwendung:

```bash
npm run start:fast
```

Wenn Sie immer noch keine Sitzung haben, führen Sie zuerst `npm start` aus, um den QR-Code oder den Pairing-Code zu konfigurieren.

### 6. Wichtige Dateien

- `src/config.json`: Hauptkonfiguration
- `dados/misa-qr/`: WhatsApp-Sitzung
- `dados/grupos/`: Gruppenkonfigurationen
- `dados/owner/config.json`: Vom Eigentümer über den Bot vorgenommene Konfigurationen

</details>

</details>
<br>

<details>
<summary><h2>🇹🇷 Türkçe</h2></summary>

# Misa Bot - WhatsApp Çoklu Cihaz 🤖

**Misa**, **Baileys** (Çoklu Cihaz) kitaplığıyla tamamen **TypeScript** ile oluşturulmuş gelişmiş ve modüler bir **WhatsApp** botudur.

Misa; kurulumu kolay, bakımı rahat ve topluluğunuz büyüdükçe sorunsuzca ölçeklenebilecek şekilde tasarlandı. Yerleşik uluslararasılaştırma (i18n) desteği sayesinde Misa şu anda **Portekizce, İngilizce, İspanyolca, Endonezce, Arapça, Fransızca, Hintçe, Urduca, Almanca, Türkçe ve Bengalceyi** destekliyor. Proje [Cognima](https://cognima.com.br/urls) tarafından geliştirildi.

## 🌐 Gerçek anlamda uluslararasılaşmış bir bot

Misa sadece menüyü çevirmekle kalmaz. Amaç, baştan sona gerçekten çok dilli bir deneyim sunmaktır.

- **Yerel dil desteği:** **Portekizce (PT)**, **İngilizce (EN)**, **İspanyolca (ES)**, **Endonezce (ID)**, **Arapça (AR)**, **Fransızca (FR)**, **Hintçe (HI)**, **Urduca (UR)**, **Almanca (DE)**, **Türkçe (TR)** ve **Bengalce (BN)** için tam destek.
- **Tam çeviri:** Terminal uyarıları, anti-link mesajları, dahili günlükler, API hataları, bağlantı akışları ve etkileşimli paneller yapılandırılan dili takip eder.
- **Dinamik takma adlar:** Komut takma adları da etkin dile göre uyarlanabilir.
- **Grup başına dil:** Genel dilin yanında her grup kendi dilini ayrı olarak belirleyebilir.

## Öğreticiler

<details>
<summary><strong>Linux Eğitimi</strong></summary>

### 1. Node.js'yi yükleyin

Node.js 22 veya üstünü kullanın.

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Doğrulayın:

```bash
node -v
npm -v
```

### 2. Projeyi indirin

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

ZIP dosyasını indirdiyseniz çıkartın ve proje klasörüne girin.

### 3. Bağımlılıkları yükleyin

```bash
npm install
```

### 4. Yapılandır

```bash
npm start
```

`Botu yapılandır` seçeneğini açın ve şunları doldurun:

- Bot adı
- Sahibinin adı
- Önek
- Ülke koduyla birlikte sahip numarası
- Misaka API anahtarı
- Otomatik güncelleme
- Bot dili (`pt`, `es`, `en`, `id`, `ar`, `fr`, `hi`, `ur`, `de`, `tr`, `bn`)

### 5. Başlat

Hala menüde:

```text
2. Botu başlat
```

Ardından QR Kodunu veya eşleştirme kodunu seçin.

### 6. Doğrudan çalıştırın

İlk konfigürasyondan sonra:

```bash
npm run start:fast
```

</details>

<details>
<summary><strong>Windows Eğitimi</strong></summary>

### 1. Programları yükleyin

Kurulum:

- Node.js 22 veya üzeri: https://nodejs.org/
- Git: https://git-scm.com/

Ardından PowerShell'i açın ve şunları doğrulayın:

```powershell
node -v
npm -v
git --version
```

### 2. Projeyi indirin

```powershell
git clone https://github.com/hiudyy/misa.git
cd misa
```

Ayrıca ZIP dosyasını GitHub'dan indirebilir, çıkarabilir ve klasörün içindeki terminali açabilirsiniz.

### 3. Bağımlılıkları yükleyin

```powershell
npm install
```

### 4. Yapılandırın ve başlatın

```powershell
npm start
```

Menüde şunu seçin:

```text
1. Botu yapılandır
```

Dil ve ad gibi istenen verileri girin. Daha sonra geri dönün ve şunu seçin:

```text
2. Botu başlat
```

QR Kodunu veya eşleştirme kodunu kullanın.

### 5. Bir dahaki sefere başlayın

```powershell
npm run start:fast
```

</details>

<details>
<summary><strong>Android Eğitimi</strong></summary>

Bu eğitimde Termux kullanılmaktadır.

### 1. Termux'u yükleyin

Termux'u F-Droid aracılığıyla yükleyin:

```text
https://f-droid.org/packages/com.termux/
```

Play Store'daki eski sürümden kaçının.

### 2. Paketleri güncelleyin

```bash
pkg update -y
pkg upgrade -y
```

### 3. Node.js ve Git'i yükleyin

```bash
pkg install -y nodejs git
```

Doğrulayın:

```bash
node -v
npm -v
git --version
```

### 4. Projeyi indirin

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

### 5. Bağımlılıkları yükleyin

```bash
npm install
```

### 6. Yapılandırın ve başlatın

```bash
npm start
```

`Botu yapılandır` seçeneğini seçin, bilgileri (dil dahil) doldurun ve ardından `Botu başlat` seçeneğini kullanın.

Eşleştirme kodu için numarayı ülke koduyla birlikte girin, örneğin:

```text
1234567890
```

### 7. Tekrar başlayın

```bash
cd misa
npm run start:fast
```

</details>

<details>
<summary><strong>VPS veya Pterodactyl Eğitimi</strong></summary>

### 1. Gereksinimler

Şunları içeren bir egg/imaj kullanın:

- Node.js 22+
- npm
- Git, doğrudan depodan klonlanıyorsa

### 2. Dosyaları yükleyin veya kopyalayın

Terminal aracılığıyla:

```bash
git clone https://github.com/hiudyy/misa.git .
```

Veya dosyaları panel yöneticisi aracılığıyla yükleyin.

### 3. Bağımlılıkları yükleyin

```bash
npm install
```

### 4. Yapılandır

Panel konsolunda:

```bash
npm start
```

`Botu yapılandır` seçeneğini seçin. Dil, önek, API gibi ayar soruları ayrı satırlarda gösterilir; bu da Pterodactyl benzeri panellerde okumayı kolaylaştırır.

### 5. Başlatma komutu

Kullanımı:

```bash
npm run start:fast
```

Hala bir oturumunuz yoksa QR Kodunu veya eşleştirme kodunu yapılandırmak için önce `npm start` komutunu çalıştırın.

### 6. Önemli dosyalar

- `src/config.json`: ana yapılandırma
- `dados/misa-qr/`: WhatsApp oturumu
- `dados/grupos/`: grup yapılandırmaları
- `dados/owner/config.json`: sahibi tarafından bot aracılığıyla yapılan yapılandırmalar

</details>

</details>
<br>

<details>
<summary><h2>🇧🇩 বাংলা</h2></summary>

# Misa Bot - WhatsApp Multi-Device 🤖

**Misa** হলো **WhatsApp**-এর জন্য একটি উন্নত ও মডুলার বট, যা পুরোপুরি **TypeScript** এবং **Baileys** (Multi-Device) লাইব্রেরি দিয়ে তৈরি।

এটি এমনভাবে তৈরি করা হয়েছে যাতে ইনস্টল করা সহজ হয়, রক্ষণাবেক্ষণ সহজ থাকে, আর আপনার কমিউনিটির সঙ্গে সঙ্গে সহজে বড় হতে পারে। বিল্ট-ইন আন্তর্জাতিকীকরণ (i18n) থাকার কারণে Misa এখন **Português, English, Español, Bahasa Indonesia, العربية, Français, हिन्दी, اردو, Deutsch, Türkçe** এবং **বাংলা** সমর্থন করে। প্রজেক্টটি তৈরি করেছে [Cognima](https://cognima.com.br/urls)।

## 🌐 সত্যিকারের বহুভাষিক বট

Misa শুধু মেনু অনুবাদ করে না। লক্ষ্য হলো শুরু থেকে শেষ পর্যন্ত সত্যিকারের বহুভাষিক অভিজ্ঞতা দেওয়া।

- **নেটিভ ভাষা:** **Português (PT)**, **English (EN)**, **Español (ES)**, **Bahasa Indonesia (ID)**, **العربية (AR)**, **Français (FR)**, **हिन्दी (HI)**, **اردو (UR)**, **Deutsch (DE)**, **Türkçe (TR)** এবং **বাংলা (BN)**-এর পূর্ণ সমর্থন।
- **সম্পূর্ণ অনুবাদ:** টার্মিনাল বার্তা, anti-link সতর্কতা, অভ্যন্তরীণ লগ, API ত্রুটি, সংযোগের ধাপ এবং ইন্টারঅ্যাকটিভ প্যানেল সবই কনফিগার করা ভাষা অনুসরণ করে।
- **ডায়নামিক অ্যালিয়াস:** কমান্ডের অ্যালিয়াসও নির্বাচিত ভাষার সঙ্গে মানিয়ে নিতে পারে।
- **প্রতি-গ্রুপ ভাষা:** গ্লোবাল ভাষার পাশাপাশি প্রতিটি গ্রুপ নিজের আলাদা ভাষা ঠিক করতে পারে।

## টিউটোরিয়াল

<details>
<summary><strong>Linux টিউটোরিয়াল</strong></summary>

### 1. Node.js ইনস্টল করুন

Node.js 22 বা তার ওপরে ব্যবহার করুন।

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

যাচাই করুন:

```bash
node -v
npm -v
```

### 2. প্রজেক্ট ডাউনলোড করুন

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

আপনি ZIP ডাউনলোড করে থাকলে, সেটা extract করে প্রজেক্ট ফোল্ডারে ঢুকুন।

### 3. ডিপেনডেন্সি ইনস্টল করুন

```bash
npm install
```

### 4. কনফিগার করুন

```bash
npm start
```

`বট কনফিগার করুন` নির্বাচন করে নিচের তথ্যগুলো দিন:

- বটের নাম
- মালিকের নাম
- প্রিফিক্স
- কান্ট্রি কোড-সহ মালিকের নম্বর
- Misaka API key
- স্বয়ংক্রিয় আপডেট
- বটের ভাষা (`pt`, `es`, `en`, `id`, `ar`, `fr`, `hi`, `ur`, `de`, `tr`, `bn`)

### 5. চালু করুন

মেনু থেকে:

```text
2. বট চালু করুন
```

তারপর QR Code বা pairing code বেছে নিন।

### 6. সরাসরি চালান

প্রথম কনফিগারেশনের পর:

```bash
npm run start:fast
```

</details>

<details>
<summary><strong>Windows টিউটোরিয়াল</strong></summary>

### 1. প্রয়োজনীয় প্রোগ্রাম ইনস্টল করুন

ইনস্টল করুন:

- Node.js 22 বা তার ওপরে: https://nodejs.org/
- Git: https://git-scm.com/

তারপর PowerShell খুলে যাচাই করুন:

```powershell
node -v
npm -v
git --version
```

### 2. প্রজেক্ট ডাউনলোড করুন

```powershell
git clone https://github.com/hiudyy/misa.git
cd misa
```

চাইলে GitHub থেকে ZIP ডাউনলোড করে extract করার পরও ফোল্ডারের ভেতরে টার্মিনাল খুলতে পারেন।

### 3. ডিপেনডেন্সি ইনস্টল করুন

```powershell
npm install
```

### 4. কনফিগার করুন এবং চালু করুন

```powershell
npm start
```

মেনুতে নির্বাচন করুন:

```text
1. বট কনফিগার করুন
```

ভাষা, নাম এবং বাকি তথ্য পূরণ করুন। তারপর ফিরে গিয়ে নির্বাচন করুন:

```text
2. বট চালু করুন
```

QR Code বা pairing code ব্যবহার করুন।

### 5. পরের বার চালু করুন

```powershell
npm run start:fast
```

</details>

<details>
<summary><strong>Android টিউটোরিয়াল</strong></summary>

এই টিউটোরিয়ালে Termux ব্যবহার করা হয়েছে।

### 1. Termux ইনস্টল করুন

F-Droid থেকে Termux ইনস্টল করুন:

```text
https://f-droid.org/packages/com.termux/
```

Play Store-এর পুরোনো ভার্সন এড়িয়ে চলুন।

### 2. প্যাকেজ আপডেট করুন

```bash
pkg update -y
pkg upgrade -y
```

### 3. Node.js এবং Git ইনস্টল করুন

```bash
pkg install -y nodejs git
```

যাচাই করুন:

```bash
node -v
npm -v
git --version
```

### 4. প্রজেক্ট ডাউনলোড করুন

```bash
git clone https://github.com/hiudyy/misa.git
cd misa
```

### 5. নির্ভরতা ইনস্টল করুন

```bash
npm install
```

### 6. কনফিগার করুন এবং চালু করুন

```bash
npm start
```

`বট কনফিগার করুন` নির্বাচন করুন, তথ্য পূরণ করুন, তারপর `বট চালু করুন` ব্যবহার করুন।

pairing code-এর জন্য দেশের কোড-সহ নম্বর দিন, উদাহরণ:

```text
1234567890
```

### 7. আবার চালু করুন

```bash
cd misa
npm run start:fast
```

</details>

<details>
<summary><strong>VPS বা Pterodactyl টিউটোরিয়াল</strong></summary>

### 1. প্রয়োজনীয়তা

এমন egg/image ব্যবহার করুন যাতে থাকে:

- Node.js 22+
- npm
- Git, যদি সরাসরি repository clone করেন

### 2. ফাইল আপলোড বা clone করুন

টার্মিনাল দিয়ে:

```bash
git clone https://github.com/hiudyy/misa.git .
```

অথবা panel manager দিয়ে ফাইল আপলোড করুন।

### 3. ডিপেনডেন্সি ইনস্টল করুন

```bash
npm install
```

### 4. কনফিগার করুন

প্যানেলের কনসোলে:

```bash
npm start
```

`বট কনফিগার করুন` নির্বাচন করুন। ভাষা, প্রিফিক্স, API ইত্যাদির প্রশ্নগুলো আলাদা লাইনে আসবে, তাই Pterodactyl-এর মতো প্যানেলে পড়তে সুবিধা হবে।

### 5. স্টার্টআপ কমান্ড

ব্যবহার করুন:

```bash
npm run start:fast
```

যদি এখনো সেশন না থাকে, আগে `npm start` চালিয়ে QR Code বা pairing code সেট করুন।

### 6. গুরুত্বপূর্ণ ফাইল

- `src/config.json`: মূল কনফিগারেশন
- `dados/misa-qr/`: WhatsApp সেশন
- `dados/grupos/`: গ্রুপ কনফিগারেশন
- `dados/owner/config.json`: মালিকের মাধ্যমে করা কনফিগারেশন

</details>
<br>
