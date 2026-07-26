/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import packageInfo from "../package.json" with { type: "json" };
import { getBotConfig, saveBotConfig, isLanguageConfigured, type BotConfig } from "./config.js";
import { startBot } from "./index.js";
import { log } from "./logger.js";
import { hasValidSession } from "./helpers/hasValidSession.js";
import { runAutoUpdate } from "./helpers/autoUpdate.js";
import { applyOperationalConfig } from "./config/runtime.js";
import { parseAdvancedInteger, parseLogLevel } from "./config/advanced.js";
import type { LogLevel } from "./config/operations.js";
import {
  createTranslator,
  DEFAULT_LOCALE,
  getGlobalLocale,
  getLocaleCodes,
  getLocaleLabel,
  getLocaleMetadata,
  isValidLocale,
  SUPPORTED_LOCALES,
  type Locale,
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

/**
 * Universal first-run language picker (no i18n — works before any locale is set).
 */
async function askInitialLanguage(rl: readline.Interface): Promise<Locale> {
  clearTerminal();

  console.log([
    "",
    paint("  ╭─────────────────────────────────────────────╮", "cyan"),
    paint("  │", "cyan") + paint("         Language / Idioma / Langue          ", "white", "bold") + paint("│", "cyan"),
    paint("  ├─────────────────────────────────────────────┤", "cyan"),
    paint("  │", "cyan") + paint("  Select your language (number or code)      ", "gray") + paint("│", "cyan"),
    paint("  ╰─────────────────────────────────────────────╯", "cyan"),
    "",
  ].join("\n"));

  SUPPORTED_LOCALES.forEach((locale, index) => {
    const meta = getLocaleMetadata(locale);
    const num = String(index + 1).padStart(2, " ");
    console.log(`   ${paint(num, "cyan", "bold")}  ${meta.nativeName} ${paint(`(${locale})`, "gray")}`);
  });
  console.log("");

  while (true) {
    const answer = (await rl.question(paint("  › ", "cyan", "bold"))).trim().toLowerCase();
    if (!answer) {
      console.log(paint("  Enter a number or language code (e.g. en, pt, es).", "yellow"));
      continue;
    }

    const asNumber = Number.parseInt(answer, 10);
    if (Number.isFinite(asNumber) && asNumber >= 1 && asNumber <= SUPPORTED_LOCALES.length) {
      return SUPPORTED_LOCALES[asNumber - 1]!;
    }

    if (isValidLocale(answer)) return answer;

    console.log(paint(`  Invalid. Use 1-${SUPPORTED_LOCALES.length} or: ${getLocaleCodes()}`, "yellow"));
  }
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

function showMenu(t: any, botName: string): void {
  console.log([
    "",
    paint("  ╭─────────────────────────────────────────────╮", "magenta"),
    paint("  │", "magenta") + paint("                     " + t("terminal.menu.title", { botName }).padEnd(25) + " ", "white", "bold") + paint("│", "magenta"),
    paint("  │", "magenta") + paint(`             ${t("terminal.menu.version")} ${version.padEnd(18)}`, "gray") + paint("│", "magenta"),
    paint("  ├─────────────────────────────────────────────┤", "magenta"),
    paint("  │", "magenta") + "                                               " + paint("│", "magenta"),
    paint("  │", "magenta") + `   ${paint(" 1 ", "magenta", "bold")}  ${paint(t("terminal.menu.configure").padEnd(35), "white")}  ` + paint("│", "magenta"),
    paint("  │", "magenta") + `   ${paint(" 2 ", "magenta", "bold")}  ${paint(t("terminal.menu.start").padEnd(35), "white")}  ` + paint("│", "magenta"),
    paint("  │", "magenta") + `   ${paint(" 3 ", "cyan", "bold")}  ${paint(t("terminal.menu.advanced").padEnd(35), "white")}  ` + paint("│", "magenta"),
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

async function askAdvancedInteger(
  rl: readline.Interface,
  t: any,
  key: string,
  current: number,
  min: number,
  max: number,
  unit: string,
): Promise<number> {
  while (true) {
    const answer = await askInput(rl, `${t(key)} [${current} ${unit}] (${min}-${max})`);
    const value = parseAdvancedInteger(answer, current, min, max);
    if (value !== null) return value;
    log.warn("CONFIG", t("terminal.advanced.invalidRange", { min: String(min), max: String(max) }));
  }
}

async function askAdvancedLogLevel(rl: readline.Interface, t: any, current: LogLevel): Promise<LogLevel> {
  while (true) {
    const answer = await askInput(rl, `${t("terminal.advanced.logLevel")} [${current}] (debug|info|warn|error|silent)`);
    const value = parseLogLevel(answer, current);
    if (value) return value;
    log.warn("CONFIG", t("terminal.advanced.invalidLogLevel"));
  }
}

async function askAdvancedConfig(rl: readline.Interface, t: any): Promise<void> {
  const current = await getBotConfig();
  const operations = structuredClone(current.operations);
  clearTerminal();
  console.log(`\n${paint(t("terminal.advanced.header"), "cyan", "bold")}\n${paint(t("terminal.advanced.pressEnter"), "gray")}\n`);

  operations.messages.maxConcurrent = await askAdvancedInteger(rl, t, "terminal.advanced.messageConcurrent", operations.messages.maxConcurrent, 1, 50, t("terminal.advanced.messages"));
  operations.messages.maxPending = await askAdvancedInteger(rl, t, "terminal.advanced.messagePending", operations.messages.maxPending, 0, 5_000, t("terminal.advanced.messages"));
  operations.messages.queueTimeoutSeconds = await askAdvancedInteger(rl, t, "terminal.advanced.messageTimeout", operations.messages.queueTimeoutSeconds, 1, 600, t("terminal.advanced.seconds"));
  operations.media.maxConcurrent = await askAdvancedInteger(rl, t, "terminal.advanced.maxConcurrent", operations.media.maxConcurrent, 1, 16, t("terminal.advanced.jobs"));
  operations.media.maxPending = await askAdvancedInteger(rl, t, "terminal.advanced.maxPending", operations.media.maxPending, 0, 1_000, t("terminal.advanced.jobs"));
  operations.media.timeoutSeconds = await askAdvancedInteger(rl, t, "terminal.advanced.timeout", operations.media.timeoutSeconds, 1, 3_600, t("terminal.advanced.seconds"));
  operations.media.ffmpegConcurrency = await askAdvancedInteger(rl, t, "terminal.advanced.ffmpeg", operations.media.ffmpegConcurrency, 1, 4, t("terminal.advanced.jobs"));

  for (const kind of ["image", "audio", "video", "document", "sticker"] as const) {
    operations.media.maxFileSizeMiB[kind] = await askAdvancedInteger(
      rl,
      t,
      `terminal.advanced.size.${kind}`,
      operations.media.maxFileSizeMiB[kind],
      1,
      2_048,
      "MiB",
    );
  }

  operations.youtube.providerRetries = await askAdvancedInteger(rl, t, "terminal.advanced.providerRetries", operations.youtube.providerRetries, 1, 10, t("terminal.advanced.attempts"));
  operations.youtube.retryDelaySeconds = await askAdvancedInteger(rl, t, "terminal.advanced.retryDelay", operations.youtube.retryDelaySeconds, 0, 60, t("terminal.advanced.seconds"));
  operations.youtube.maxFailures = await askAdvancedInteger(rl, t, "terminal.advanced.maxFailures", operations.youtube.maxFailures, 1, 20, t("terminal.advanced.failures"));
  operations.youtube.cooldownMinutes = await askAdvancedInteger(rl, t, "terminal.advanced.cooldown", operations.youtube.cooldownMinutes, 0, 1_440, t("terminal.advanced.minutes"));
  operations.logging.level = await askAdvancedLogLevel(rl, t, operations.logging.level);
  operations.updates.maxBackups = await askAdvancedInteger(rl, t, "terminal.advanced.maxBackups", operations.updates.maxBackups, 1, 50, t("terminal.advanced.backups"));

  console.log(`\n${paint(t("terminal.advanced.summary"), "white", "bold")}\n${JSON.stringify(operations, null, 2)}\n`);
  const confirmed = await askBoolean(rl, t("terminal.advanced.confirm"), true, t);
  if (!confirmed) {
    log.info("CONFIG", t("terminal.advanced.cancelled"));
    return;
  }
  await saveBotConfig({ ...current, operations });
  log.success("CONFIG", t("terminal.advanced.saved"));
  log.warn("CONFIG", t("terminal.advanced.restartRequired"));
  await sleep(1_400);
  clearTerminal();
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  try {
    let currentConfig = await getBotConfig();
    applyOperationalConfig(currentConfig.operations);

    if (!(await isLanguageConfigured())) {
      const language = await askInitialLanguage(rl);
      currentConfig = { ...currentConfig, language };
      await saveBotConfig(currentConfig);
    }

    const globalLocale = isValidLocale(currentConfig.language) ? currentConfig.language : DEFAULT_LOCALE;
    let t = createTranslator(globalLocale);

    await showIntro(t);

    if (currentConfig.autoUpdate) {
      await runAutoUpdate({ maxBackups: currentConfig.operations.updates.maxBackups });
    }

    while (true) {
      showMenu(t, currentConfig.botName);

      const option = (await rl.question(paint(t("terminal.menu.chooseOption"), "magenta", "bold"))).trim();

      if (option === "0") {
        clearTerminal();
        log.info(currentConfig.botName, t("terminal.goodbye"));
        rl.close();
        process.exit(0);
      }

      if (option === "1") {
        await askBotConfig(rl, t);
        currentConfig = await getBotConfig();
        const newLocale = isValidLocale(currentConfig.language) ? currentConfig.language : DEFAULT_LOCALE;
        t = createTranslator(newLocale);
        continue;
      }

      if (option === "2") {
        // Verifica se já existe sessão
        const hasSession = await hasValidSession();
        
        if (hasSession) {
          clearTerminal();
          log.info(currentConfig.botName, t("terminal.sessionDetected"));
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
            log.warn(currentConfig.botName, t("terminal.invalidPhone"));
            await sleep(1000);
            clearTerminal();
            continue;
          }
          clearTerminal();
          await startBot("pairing", phone);
          return;
        }

        log.warn(currentConfig.botName, t("terminal.invalidOption"));
        await sleep(1000);
        clearTerminal();
        continue;
      }

      if (option === "3") {
        await askAdvancedConfig(rl, t);
        currentConfig = await getBotConfig();
        continue;
      }

      log.warn(currentConfig.botName, t("terminal.invalidOption"));
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
    const config = await getBotConfig();
    log.warn(config.botName, t("terminal.startCancelled"));
    return;
  }

  const config = await getBotConfig();
  log.error(config.botName, t("terminal.startFailed"), error);
});
