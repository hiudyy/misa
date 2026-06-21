/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { log } from "./logger.js";
import { DEFAULT_LOCALE, t } from "./i18n/index.js";
import type { Locale } from "./i18n/index.js";

export type BotConfig = {
  botName: string;
  ownerName: string;
  prefix: string;
  ownerNumber: string;
  ownerLID?: string;
  apiKey: string;
  autoUpdate: boolean;
  language: Locale;
};

const defaultConfig: BotConfig = {
  botName: "Misa",
  ownerName: "Cognima / Hiudy",
  prefix: "!",
  ownerNumber: "",
  apiKey: "",
  autoUpdate: false,
  language: "pt",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, "config.json");

async function readConfigFile(filePath: string): Promise<Partial<BotConfig> | null> {
  let config: Partial<BotConfig> | null = null;
  try {
    const rawConfig = await fs.readFile(filePath, "utf8");
    config = JSON.parse(rawConfig) as Partial<BotConfig>;
    return config;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") return null;

    log.warn("CONFIG", t("logs.configReadFailed", config?.language ?? DEFAULT_LOCALE, { path: filePath }));
    return null;
  }
}

export async function getBotConfig(): Promise<BotConfig> {
  const config = await readConfigFile(configPath);

  if (!config) return structuredClone(defaultConfig);

  return {
    ...defaultConfig,
    ...config,
  };
}

export async function saveBotConfig(config: BotConfig): Promise<void> {
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
