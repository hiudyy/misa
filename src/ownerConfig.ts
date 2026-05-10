/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import { paths } from "./config/paths.js";
import { getBotConfig } from "./config.js";
import { log } from "./logger.js";

export type OwnerConfig = {
  comandoNaoEncontrado: {
    modo: "texto" | "mencao";
    texto: string;
  };
};

const defaultOwnerConfig: OwnerConfig = {
  comandoNaoEncontrado: {
    modo: "texto",
    texto: "❌ @usuario, o comando @comando não existe.\n\nTalvez você quis dizer: @parecido (@similaridade)\nUse @prefixomenu para ver os comandos.",
  },
};

async function readOwnerConfigFile(): Promise<Partial<OwnerConfig> | null> {
  try {
    const rawConfig = await fs.readFile(paths.ownerConfig, "utf8");
    return JSON.parse(rawConfig) as Partial<OwnerConfig>;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") return null;

    log.warn("OWNERCONFIG", `Nao foi possivel ler ${paths.ownerConfig}.`);
    return null;
  }
}

async function migrateLegacyOwnerConfigIfNeeded(): Promise<Partial<OwnerConfig> | null> {
  const currentConfig = await readOwnerConfigFile();
  if (currentConfig) return currentConfig;

  const legacyConfig = await getBotConfig();
  const legacyUnknown = (legacyConfig as Partial<OwnerConfig>).comandoNaoEncontrado;
  if (!legacyUnknown) return null;

  const migratedConfig: OwnerConfig = {
    ...defaultOwnerConfig,
    comandoNaoEncontrado: {
      ...defaultOwnerConfig.comandoNaoEncontrado,
      ...legacyUnknown,
    },
  };

  await fs.mkdir(paths.owner, { recursive: true });
  await fs.writeFile(paths.ownerConfig, `${JSON.stringify(migratedConfig, null, 2)}\n`, "utf8");
  log.info("OWNERCONFIG", `Configuracao migrada para ${paths.ownerConfig}.`);

  return migratedConfig;
}

export async function getOwnerConfig(): Promise<OwnerConfig> {
  const config = await migrateLegacyOwnerConfigIfNeeded();

  if (!config) return structuredClone(defaultOwnerConfig);

  return {
    ...defaultOwnerConfig,
    ...config,
    comandoNaoEncontrado: {
      ...defaultOwnerConfig.comandoNaoEncontrado,
      ...config.comandoNaoEncontrado,
    },
  };
}

export async function saveOwnerConfig(config: OwnerConfig): Promise<void> {
  await fs.mkdir(paths.owner, { recursive: true });
  await fs.writeFile(paths.ownerConfig, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
