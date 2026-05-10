/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { paths } from "./config/paths.js";
import { log } from "./logger.js";

export type BotConfig = {
  botName: string;
  ownerName: string;
  prefix: string;
  ownerNumber: string;
  ownerLID?: string;
  apiKey: string;
  autoUpdate: boolean;
  comandoNaoEncontrado: {
    modo: "texto" | "mencao";
    texto: string;
  };
};

const defaultConfig: BotConfig = {
  botName: "Misa",
  ownerName: "Cognima / Hiudy",
  prefix: "!",
  ownerNumber: "",
  apiKey: "",
  autoUpdate: false,
  comandoNaoEncontrado: {
    modo: "texto",
    texto: "❌ @usuario, o comando *@comando* não existe.\n\nTalvez você quis dizer: *@parecido* (@similaridade)\nUse *@prefixo*menu* para ver os comandos.",
  },
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const legacyConfigPath = path.join(__dirname, "config.json");

async function readConfigFile(filePath: string): Promise<Partial<BotConfig> | null> {
  try {
    const rawConfig = await fs.readFile(filePath, "utf8");
    return JSON.parse(rawConfig) as Partial<BotConfig>;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") return null;

    log.warn("CONFIG", `Nao foi possivel ler ${filePath}.`);
    return null;
  }
}

export async function getBotConfig(): Promise<BotConfig> {
  const config = await readConfigFile(paths.ownerConfig) ?? await readConfigFile(legacyConfigPath);

  if (!config) return structuredClone(defaultConfig);

  return {
    ...defaultConfig,
    ...config,
    comandoNaoEncontrado: {
      ...defaultConfig.comandoNaoEncontrado,
      ...config.comandoNaoEncontrado,
    },
  };
}

export async function saveBotConfig(config: BotConfig): Promise<void> {
  await fs.mkdir(paths.owner, { recursive: true });
  await fs.writeFile(paths.ownerConfig, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
