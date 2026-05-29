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
import {
  createTranslator,
  DEFAULT_LOCALE,
  getGlobalLocale,
  getLocaleCodes,
  getLocaleLabel,
  isValidLocale,
} from "./i18n/index.js";

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

async function askBoolean(rl: readline.Interface, question: string, currentValue: boolean, t: any): Promise<boolean> {
  const currentLabel = currentValue ? t("common.yes")[0].toUpperCase() : t("common.no")[0].toUpperCase();

  while (true) {
    const answer = (await askInput(rl, `${question} [${currentLabel}] ${t("terminal.config.boolPrompt")}`)).trim().toLowerCase();

    if (!answer) return currentValue;
    
    const boolYes = t("terminal.boolYes").split("|");
    const boolNo = t("terminal.boolNo").split("|");

    if (boolYes.includes(answer)) return true;
    if (boolNo.includes(answer)) return false;

    log.warn("CONFIG", t("terminal.config.boolInvalid"));
  }
}

async function showIntro(t: any): Promise<void> {
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

  await typeLine(paint(t("terminal.initializing"), "gray", "dim"), 22);
  await sleep(900);
  clearTerminal();
}

function showMenu(t: any): void {
  console.log([
    "",
    paint("  ╭─────────────────────────────────────────────╮", "magenta"),
    paint("  │", "magenta") + paint("                     " + t("terminal.menu.title").padEnd(25) + " ", "white", "bold") + paint("│", "magenta"),
    paint("  │", "magenta") + paint(`             ${t("terminal.menu.version")} ${version.padEnd(18)}`, "gray") + paint("│", "magenta"),
    paint("  ├─────────────────────────────────────────────┤", "magenta"),
    paint("  │", "magenta") + "                                               " + paint("│", "magenta"),
    paint("  │", "magenta") + `   ${paint(" 1 ", "magenta", "bold")}  ${paint(t("terminal.menu.configure").padEnd(35), "white")}  ` + paint("│", "magenta"),
    paint("  │", "magenta") + `   ${paint(" 2 ", "magenta", "bold")}  ${paint(t("terminal.menu.start").padEnd(35), "white")}  ` + paint("│", "magenta"),
    paint("  │", "magenta") + `   ${paint(" 0 ", "gray", "bold")}  ${paint(t("terminal.menu.exit").padEnd(35), "gray")}  ` + paint("│", "magenta"),
    paint("  │", "magenta") + "                                               " + paint("│", "magenta"),
    paint("  ╰─────────────────────────────────────────────╯", "magenta"),
    "",
  ].join("\n"));
}

function showConfigHeader(t: any): void {
  clearTerminal();
  console.log([
    "",
    paint("  ╭─────────────────────────────────────────────╮", "cyan"),
    paint("  │", "cyan") + paint(t("terminal.config.header").padStart(30).padEnd(46), "white", "bold") + paint("│", "cyan"),
    paint("  ├─────────────────────────────────────────────┤", "cyan"),
    paint("  │", "cyan") + paint(t("terminal.config.pressEnter").padEnd(47), "gray") + paint("│", "cyan"),
    paint("  ╰─────────────────────────────────────────────╯", "cyan"),
    "",
  ].join("\n"));
}

async function askBotConfig(rl: readline.Interface, t: any): Promise<void> {
  const currentConfig = await getBotConfig();

  showConfigHeader(t);

  const botName = keepOrUpdate(await askInput(rl, `${t("terminal.config.botName")} [${currentConfig.botName}]`), currentConfig.botName);
  const ownerName = keepOrUpdate(
    await askInput(rl, `${t("terminal.config.ownerName")} [${currentConfig.ownerName}]`),
    currentConfig.ownerName,
  );
  const prefix = keepOrUpdate(await askInput(rl, `${t("terminal.config.prefix")} [${currentConfig.prefix}]`), currentConfig.prefix);
  const ownerNumber = keepOrUpdate(
    await askInput(rl, `${t("terminal.config.ownerNumber")} [${currentConfig.ownerNumber || t("terminal.config.notConfigured")}]`),
    currentConfig.ownerNumber,
  );

  console.log(`\n${t("terminal.config.apiKeyHint").replace("[CONFIG]", paint("[CONFIG]", "cyan")).replace("https://misaka.com.br", paint("https://misaka.com.br", "yellow"))}`);
  const apiKey = keepOrUpdate(
    await askInput(rl, `${t("terminal.config.apiKey")} [${currentConfig.apiKey ? t("terminal.config.configured") : t("terminal.config.notConfigured")}]`),
    currentConfig.apiKey,
  );
  const autoUpdate = await askBoolean(rl, t("terminal.config.autoUpdate"), currentConfig.autoUpdate, t);
  const currentLanguage = isValidLocale(currentConfig.language) ? currentConfig.language : DEFAULT_LOCALE;
  const rawLang = keepOrUpdate(
    await askInput(
      rl,
      `${t("terminal.config.language")} ${t("terminal.config.languageHint", { options: getLocaleCodes() })} [${getLocaleLabel(currentLanguage)}]`,
    ),
    currentLanguage,
  );
  const nextLanguage = rawLang.toLowerCase();
  const language = isValidLocale(nextLanguage) ? nextLanguage : currentLanguage;

  const nextConfig: BotConfig = {
    ...currentConfig,
    botName,
    ownerName,
    prefix,
    ownerNumber,
    apiKey,
    autoUpdate,
    language,
  };

  await saveBotConfig(nextConfig);
  clearTerminal();
  console.log([
    "",
    paint("  ╭─────────────────────────────────────────────╮", "green"),
    paint("  │", "green") + paint(t("terminal.config.saved").padStart(33).padEnd(46), "white", "bold") + paint("│", "green"),
    paint("  ├─────────────────────────────────────────────┤", "green"),
    paint("  │", "green") + paint(t("terminal.config.fileUpdated").padEnd(47), "gray") + paint("│", "green"),
    paint("  ╰─────────────────────────────────────────────╯", "green"),
    "",
  ].join("\n"));
  await sleep(1400);
  clearTerminal();
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  try {
    const globalLocale = await getGlobalLocale();
    let t = createTranslator(globalLocale);

    await showIntro(t);

    const config = await getBotConfig();
    if (config.autoUpdate) await runAutoUpdate();

    while (true) {
      showMenu(t);

      const option = (await rl.question(paint(t("terminal.menu.chooseOption"), "magenta", "bold"))).trim();

      if (option === "0") {
        clearTerminal();
        log.info("MISA", t("terminal.goodbye"));
        rl.close();
        process.exit(0);
      }

      if (option === "1") {
        await askBotConfig(rl, t);
        const newLocale = await getGlobalLocale();
        t = createTranslator(newLocale);
        continue;
      }

      if (option === "2") {
        // Verifica se já existe sessão
        const hasSession = await hasValidSession();
        
        if (hasSession) {
          clearTerminal();
          log.info("MISA", t("terminal.sessionDetected"));
          await startBot("qr");
          return;
        }

        clearTerminal();
        console.log([
          "",
          paint("  ╭─────────────────────────────────────────────╮", "magenta"),
          paint("  │", "magenta") + paint(t("terminal.connection.title").padStart(33).padEnd(46), "white", "bold") + paint("│", "magenta"),
          paint("  ├─────────────────────────────────────────────┤", "magenta"),
          paint("  │", "magenta") + "                                               " + paint("│", "magenta"),
          paint("  │", "magenta") + `   ${paint(" 1 ", "magenta", "bold")}  ${paint(t("terminal.connection.qr").padEnd(40), "white")} ` + paint("│", "magenta"),
          paint("  │", "magenta") + `   ${paint(" 2 ", "magenta", "bold")}  ${paint(t("terminal.connection.pairing").padEnd(16), "white")} ${paint(t("terminal.connection.pairingHint").padEnd(23), "gray")} ` + paint("│", "magenta"),
          paint("  │", "magenta") + `   ${paint(" 0 ", "gray", "bold")}  ${paint(t("terminal.connection.back").padEnd(40), "gray")} ` + paint("│", "magenta"),
          paint("  │", "magenta") + "                                               " + paint("│", "magenta"),
          paint("  ╰─────────────────────────────────────────────╯", "magenta"),
          "",
        ].join("\n"));

        const connOption = (await rl.question(paint(t("terminal.menu.chooseOption"), "magenta", "bold"))).trim();

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
          const phone = (await rl.question(paint(t("terminal.connection.phonePrompt"), "cyan", "bold"))).trim().replace(/\D/g, "");
          if (!phone) {
            log.warn("MISA", t("terminal.invalidPhone"));
            await sleep(1000);
            clearTerminal();
            continue;
          }
          clearTerminal();
          await startBot("pairing", phone);
          return;
        }

        log.warn("MISA", t("terminal.invalidOption"));
        await sleep(1000);
        clearTerminal();
        continue;
      }

      log.warn("MISA", t("terminal.invalidOption"));
      await sleep(1000);
      clearTerminal();
    }
  } finally {
    rl.close();
  }
}

main().catch(async (error) => {
  const globalLocale = await getGlobalLocale();
  const t = createTranslator(globalLocale);

  if ((error as NodeJS.ErrnoException).code === "ABORT_ERR") {
    log.warn("MISA", t("terminal.startCancelled"));
    return;
  }

  log.error("MISA", t("terminal.startFailed"), error);
});
