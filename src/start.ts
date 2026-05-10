/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import packageInfo from "../package.json" with { type: "json" };
import { getBotConfig, saveBotConfig, type BotConfig } from "./config.js";
import { startBot } from "./index.js";
import { log } from "./logger.js";
import { hasValidSession } from "./helpers/hasValidSession.js";
import { runAutoUpdate } from "./helpers/autoUpdate.js";

const shouldAnimate = output.isTTY;
const version = packageInfo.version;
const colorEnabled = output.isTTY;
const color = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
  white: "\x1b[97m",
};

function paint(text: string, ...styles: Array<keyof typeof color>): string {
  if (!colorEnabled) return text;

  return `${styles.map((style) => color[style]).join("")}${text}${color.reset}`;
}

function clearTerminal(): void {
  output.write("\x1Bc");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function typeText(text: string, speed = 28): Promise<void> {
  if (!shouldAnimate) {
    output.write(text);
    return;
  }

  for (const char of text) {
    output.write(char);
    await sleep(char === "\n" ? speed * 5 : speed);
  }
}

async function typeLine(text = "", speed?: number): Promise<void> {
  await typeText(`${text}\n`, speed);
}

function keepOrUpdate(answer: string, currentValue: string): string {
  const value = answer.trim();
  return value || currentValue;
}

async function askInput(rl: readline.Interface, label: string): Promise<string> {
  console.log(label);
  return rl.question(paint("  › ", "cyan", "bold"));
}

async function askBoolean(rl: readline.Interface, question: string, currentValue: boolean): Promise<boolean> {
  const currentLabel = currentValue ? "S" : "N";

  while (true) {
    const answer = (await askInput(rl, `${question} [${currentLabel}] (s/y/N)`)).trim().toLowerCase();

    if (!answer) return currentValue;
    if (["s", "sim", "y", "yes"].includes(answer)) return true;
    if (["n", "nao", "não", "no"].includes(answer)) return false;

    log.warn("CONFIG", "Responda com s/y para sim, n para nao, ou Enter para manter.");
  }
}

async function showIntro(): Promise<void> {
  clearTerminal();

  const banner = [
    paint("  ███╗   ███╗██╗███████╗ █████╗ ", "magenta", "bold"),
    paint("  ████╗ ████║██║██╔════╝██╔══██╗", "magenta", "bold"),
    paint("  ██╔████╔██║██║███████╗███████║", "magenta", "bold"),
    paint("  ██║╚██╔╝██║██║╚════██║██╔══██║", "magenta", "bold"),
    paint("  ██║ ╚═╝ ██║██║███████║██║  ██║", "magenta", "bold"),
    paint("  ╚═╝     ╚═╝╚═╝╚══════╝╚═╝  ╚═╝", "magenta", "bold"),
    "",
    paint(`  ${ "v" + version.padEnd(28) }`, "gray", "dim"),
    paint("  by Hiudy · github.com/hiudyy    ", "gray", "dim"),
  ];

  for (const line of banner) console.log(line);
  console.log("");
  await sleep(400);

  await typeLine(paint("  Inicializando...", "gray", "dim"), 22);
  await sleep(900);
  clearTerminal();
}

function showMenu(): void {
  console.log([
    "",
    paint("  ╭─────────────────────────────────────────────╮", "magenta"),
    paint("  │", "magenta") + paint("                     MISA                     ", "white", "bold") + paint("│", "magenta"),
    paint("  │", "magenta") + paint(`             versao ${version.padEnd(25)}`, "gray") + paint("│", "magenta"),
    paint("  ├─────────────────────────────────────────────┤", "magenta"),
    paint("  │", "magenta") + "                                               " + paint("│", "magenta"),
    paint("  │", "magenta") + `   ${paint(" 1 ", "magenta", "bold")}  ${paint("Configurar bot", "white")}                          ` + paint("│", "magenta"),
    paint("  │", "magenta") + `   ${paint(" 2 ", "magenta", "bold")}  ${paint("Iniciar bot", "white")}                             ` + paint("│", "magenta"),
    paint("  │", "magenta") + `   ${paint(" 0 ", "gray", "bold")}  ${paint("Sair", "gray")}                                    ` + paint("│", "magenta"),
    paint("  │", "magenta") + "                                               " + paint("│", "magenta"),
    paint("  ╰─────────────────────────────────────────────╯", "magenta"),
    "",
  ].join("\n"));
}

function showConfigHeader(): void {
  clearTerminal();
  console.log([
    "",
    paint("  ╭─────────────────────────────────────────────╮", "cyan"),
    paint("  │", "cyan") + paint("               CONFIGURAR BOT                 ", "white", "bold") + paint("│", "cyan"),
    paint("  ├─────────────────────────────────────────────┤", "cyan"),
    paint("  │", "cyan") + paint("   Pressione Enter para manter o valor atual  ", "gray") + paint("│", "cyan"),
    paint("  ╰─────────────────────────────────────────────╯", "cyan"),
    "",
  ].join("\n"));
}

async function askBotConfig(rl: readline.Interface): Promise<void> {
  const currentConfig = await getBotConfig();

  showConfigHeader();

  const botName = keepOrUpdate(await askInput(rl, `Nome do bot [${currentConfig.botName}]`), currentConfig.botName);
  const ownerName = keepOrUpdate(
    await askInput(rl, `Nome do dono [${currentConfig.ownerName}]`),
    currentConfig.ownerName,
  );
  const prefix = keepOrUpdate(await askInput(rl, `Prefixo do bot [${currentConfig.prefix}]`), currentConfig.prefix);
  const ownerNumber = keepOrUpdate(
    await askInput(rl, `Numero do dono [${currentConfig.ownerNumber || "nao configurado"}]`),
    currentConfig.ownerNumber,
  );

  console.log(`\n${paint("[CONFIG]", "cyan")} A API key pode ser obtida em ${paint("https://misaka.com.br", "yellow")}`);
  const apiKey = keepOrUpdate(
    await askInput(rl, `API key [${currentConfig.apiKey ? "configurada" : "nao configurada"}]`),
    currentConfig.apiKey,
  );
  const autoUpdate = await askBoolean(rl, "Atualizacao automatica", currentConfig.autoUpdate);

  const nextConfig: BotConfig = {
    ...currentConfig,
    botName,
    ownerName,
    prefix,
    ownerNumber,
    apiKey,
    autoUpdate,
  };

  await saveBotConfig(nextConfig);
  clearTerminal();
  console.log([
    "",
    paint("  ╭─────────────────────────────────────────────╮", "green"),
    paint("  │", "green") + paint("             CONFIGURACAO SALVA               ", "white", "bold") + paint("│", "green"),
    paint("  ├─────────────────────────────────────────────┤", "green"),
    paint("  │", "green") + paint("   Arquivo atualizado: src/config.json        ", "gray") + paint("│", "green"),
    paint("  ╰─────────────────────────────────────────────╯", "green"),
    "",
  ].join("\n"));
  await sleep(1400);
  clearTerminal();
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  try {
    await showIntro();

    const config = await getBotConfig();
    if (config.autoUpdate) await runAutoUpdate();

    while (true) {
      showMenu();

      const option = (await rl.question(paint("  › Escolha uma opcao: ", "magenta", "bold"))).trim();

      if (option === "0") {
        clearTerminal();
        log.info("MISA", "Ate logo.");
        rl.close();
        process.exit(0);
      }

      if (option === "1") {
        await askBotConfig(rl);
        continue;
      }

      if (option === "2") {
        // Verifica se já existe sessão
        const hasSession = await hasValidSession();
        
        if (hasSession) {
          clearTerminal();
          log.info("MISA", "Sessao existente detectada. Conectando automaticamente...");
          await startBot("qr");
          return;
        }

        clearTerminal();
        console.log([
          "",
          paint("  ╭─────────────────────────────────────────────╮", "magenta"),
          paint("  │", "magenta") + paint("              METODO DE CONEXAO               ", "white", "bold") + paint("│", "magenta"),
          paint("  ├─────────────────────────────────────────────┤", "magenta"),
          paint("  │", "magenta") + "                                               " + paint("│", "magenta"),
          paint("  │", "magenta") + `   ${paint(" 1 ", "magenta", "bold")}  ${paint("QR Code", "white")}                                 ` + paint("│", "magenta"),
          paint("  │", "magenta") + `   ${paint(" 2 ", "magenta", "bold")}  ${paint("Pairing Code", "white")} ${paint("(numero de telefone)", "gray")}      ` + paint("│", "magenta"),
          paint("  │", "magenta") + `   ${paint(" 0 ", "gray", "bold")}  ${paint("Voltar", "gray")}                                  ` + paint("│", "magenta"),
          paint("  │", "magenta") + "                                               " + paint("│", "magenta"),
          paint("  ╰─────────────────────────────────────────────╯", "magenta"),
          "",
        ].join("\n"));

        const connOption = (await rl.question(paint("  › Escolha uma opcao: ", "magenta", "bold"))).trim();

        if (connOption === "0") {
          clearTerminal();
          continue;
        }

        if (connOption === "1") {
          clearTerminal();
          await startBot("qr");
          return;
        }

        if (connOption === "2") {
          const phone = (await rl.question(paint("  › Numero com DDI (ex: 5511999999999): ", "cyan", "bold"))).trim().replace(/\D/g, "");
          if (!phone) {
            log.warn("MISA", "Numero invalido.");
            await sleep(1000);
            clearTerminal();
            continue;
          }
          clearTerminal();
          await startBot("pairing", phone);
          return;
        }

        log.warn("MISA", "Opcao invalida. Tente novamente.");
        await sleep(1000);
        clearTerminal();
        continue;
      }

      log.warn("MISA", "Opcao invalida. Tente novamente.");
      await sleep(1000);
      clearTerminal();
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  if ((error as NodeJS.ErrnoException).code === "ABORT_ERR") {
    log.warn("MISA", "Start cancelado.");
    return;
  }

  log.error("MISA", "Falha no start.", error);
});
