/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import { paths } from "./config/paths.js";
import { log } from "./logger.js";
import type { Locale } from "./i18n/index.js";
import { DEFAULT_LOCALE, t, isValidLocale } from "./i18n/index.js";
import { readJson, updateJson, writeJson } from "./storage/jsonStore.js";
import { isValidPrefixSymbol } from "./helpers/resolveCommandPrefix.js";
import { CURRENT_CONFIG_SCHEMA_VERSION, migrateBotConfig } from "./config/migrations.js";
import {
  defaultOperationalConfig,
  normalizeOperationalConfig,
  type OperationalConfig,
} from "./config/operations.js";

export type BotConfig = {
  schemaVersion: number;
  botName: string;
  ownerName: string;
  prefix: string;
  /** Opt-in: locale → prefix. Empty/absent = only legacy prefix is active. */
  prefixByLocale?: Partial<Record<Locale, string>>;
  ownerNumber: string;
  ownerLID?: string;
  autoUpdate: boolean;
  language: Locale;
  operations: OperationalConfig;
};

export const defaultConfig: BotConfig = {
  schemaVersion: CURRENT_CONFIG_SCHEMA_VERSION,
  botName: "Misa",
  ownerName: "Hiudy",
  prefix: "!",
  prefixByLocale: {},
  ownerNumber: "",
  autoUpdate: false,
  language: "pt",
  operations: structuredClone(defaultOperationalConfig),
};

let botConfigCache: BotConfig | null = null;
let botConfigLoad: Promise<BotConfig> | null = null;

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function normalizePrefixMap(value: unknown): BotConfig["prefixByLocale"] {
  const input = asObject(value);
  const result: BotConfig["prefixByLocale"] = {};
  const used = new Set<string>();
  for (const [locale, prefix] of Object.entries(input)) {
    if (isValidLocale(locale) && typeof prefix === "string" && isValidPrefixSymbol(prefix) && !used.has(prefix)) {
      result[locale] = prefix;
      used.add(prefix);
    }
  }
  return result;
}

export function normalizeBotConfig(value: unknown): BotConfig {
  const input = migrateBotConfig(value);
  return {
    schemaVersion: CURRENT_CONFIG_SCHEMA_VERSION,
    botName: typeof input.botName === "string" && input.botName.trim() ? input.botName : defaultConfig.botName,
    ownerName: typeof input.ownerName === "string" && input.ownerName.trim() ? input.ownerName : defaultConfig.ownerName,
    prefix: typeof input.prefix === "string" && isValidPrefixSymbol(input.prefix)
      ? input.prefix
      : defaultConfig.prefix,
    prefixByLocale: normalizePrefixMap(input.prefixByLocale),
    ownerNumber: typeof input.ownerNumber === "string" ? input.ownerNumber : defaultConfig.ownerNumber,
    ...(typeof input.ownerLID === "string" && input.ownerLID ? { ownerLID: input.ownerLID } : {}),
    autoUpdate: typeof input.autoUpdate === "boolean" ? input.autoUpdate : defaultConfig.autoUpdate,
    language: typeof input.language === "string" && isValidLocale(input.language) ? input.language : defaultConfig.language,
    operations: normalizeOperationalConfig(input.operations),
  };
}

async function migrateLegacyConfig(): Promise<void> {
  try {
    await fs.access(paths.botConfig);
    return;
  } catch {
    // O novo arquivo ainda nao existe.
  }

  try {
    await fs.access(paths.legacyBotConfig);
    const migrated = await readJson(paths.legacyBotConfig, { defaultValue: defaultConfig, normalize: normalizeBotConfig });
    await writeJson(paths.botConfig, migrated);
    await fs.rm(paths.legacyBotConfig, { force: true });
    log.info("CONFIG", t("logs.configMigrated", migrated.language, { path: paths.botConfig }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      log.warn("CONFIG", t("logs.configReadFailed", DEFAULT_LOCALE, { path: paths.legacyBotConfig }));
    }
  }
}

export async function getBotConfig(): Promise<BotConfig> {
  if (botConfigCache) return structuredClone(botConfigCache);
  botConfigLoad ??= (async () => {
    await migrateLegacyConfig();
    const config = await readJson(paths.botConfig, { defaultValue: defaultConfig, normalize: normalizeBotConfig });
    botConfigCache = structuredClone(config);
    return config;
  })().finally(() => {
    botConfigLoad = null;
  });
  return structuredClone(await botConfigLoad);
}

/** True only if config.json exists and has an explicit valid language field. */
export async function isLanguageConfigured(): Promise<boolean> {
  await migrateLegacyConfig();
  try {
    const raw = JSON.parse(await fs.readFile(paths.botConfig, "utf8")) as { language?: unknown };
    return typeof raw.language === "string" && isValidLocale(raw.language);
  } catch {
    return false;
  }
}

export async function saveBotConfig(config: BotConfig): Promise<void> {
  const normalized = normalizeBotConfig(config);
  await writeJson(paths.botConfig, normalized);
  botConfigCache = structuredClone(normalized);
}

export async function updateBotConfig(update: (current: BotConfig) => BotConfig | Promise<BotConfig>): Promise<BotConfig> {
  const updated = await updateJson(paths.botConfig, { defaultValue: defaultConfig, normalize: normalizeBotConfig }, update);
  botConfigCache = structuredClone(updated);
  return structuredClone(updated);
}

export function clearBotConfigCache(): void {
  botConfigCache = null;
  botConfigLoad = null;
}

export { CURRENT_CONFIG_SCHEMA_VERSION } from "./config/migrations.js";
export { defaultOperationalConfig, normalizeOperationalConfig } from "./config/operations.js";
export type { OperationalConfig, LogLevel } from "./config/operations.js";
