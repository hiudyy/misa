/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { log } from "./logger.js";

export type BotConfig = {
  botName: string;
  ownerName: string;
  prefix: string;
  ownerNumber: string;
  ownerLID?: string;
  apiKey: string;
  autoUpdate: boolean;
};

const defaultConfig: BotConfig = {
  botName: "Misa",
  ownerName: "Cognima / Hiudy",
  prefix: "!",
  ownerNumber: "",
  apiKey: "",
  autoUpdate: false,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, "config.json");

export async function getBotConfig(): Promise<BotConfig> {
  try {
    const rawConfig = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(rawConfig) as Partial<BotConfig>;

    return {
      ...defaultConfig,
      ...config,
    };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== "ENOENT") {
      log.warn("CONFIG", "Nao foi possivel ler src/config.json. Usando configuracao padrao.");
    }

    return defaultConfig;
  }
}

export async function saveBotConfig(config: BotConfig): Promise<void> {
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
