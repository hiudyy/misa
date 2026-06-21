/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import { paths } from "./config/paths.js";
import { getBotConfig } from "./config.js";
import { DEFAULT_LOCALE, t } from "./i18n/index.js";
import { log } from "./logger.js";

export type OwnerConfig = {
  comandoNaoEncontrado: {
    modo: "texto" | "mencao";
    texto: string;
  };
  antiPrivate: boolean;
  blockedUsers: BlockedUserEntry[];
  blockedCommands: string[];
};

export type BlockedUserEntry = {
  lid: string;
  number?: string;
  name?: string;
  expiresAt?: string | null;
  reason?: string | null;
  createdAt: string;
  createdBy: string;
};

const defaultOwnerConfig: OwnerConfig = {
  comandoNaoEncontrado: {
    modo: "texto",
    texto: "❌ @usuario, o comando @comando não existe.\n\nTalvez você quis dizer: @parecido (@similaridade)\nUse @prefixomenu para ver os comandos.",
  },
  antiPrivate: false,
  blockedUsers: [],
  blockedCommands: [],
};

async function readOwnerConfigFile(): Promise<Partial<OwnerConfig> | null> {
  try {
    const rawConfig = await fs.readFile(paths.ownerConfig, "utf8");
    return JSON.parse(rawConfig) as Partial<OwnerConfig>;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") return null;

    const config = await getBotConfig();
    log.warn("OWNERCONFIG", t("logs.configReadFailed", config.language, { path: paths.ownerConfig }));
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
  const config = await getBotConfig();
  log.info("OWNERCONFIG", t("logs.configMigrated", config.language, { path: paths.ownerConfig }));

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
    blockedUsers: normalizeBlockedUsers(config.blockedUsers),
    blockedCommands: normalizeBlockedCommands(config.blockedCommands),
  };
}

export async function saveOwnerConfig(config: OwnerConfig): Promise<void> {
  await fs.mkdir(paths.owner, { recursive: true });
  await fs.writeFile(paths.ownerConfig, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function normalizeBlockedUsers(entries: unknown): BlockedUserEntry[] {
  if (!Array.isArray(entries)) return [];

  return entries
    .filter((entry): entry is Partial<BlockedUserEntry> & { lid: string; createdAt: string; createdBy: string } => {
      return typeof entry === "object" && entry !== null
        && typeof entry.lid === "string"
        && typeof entry.createdAt === "string"
        && typeof entry.createdBy === "string";
    })
    .map((entry) => ({
      lid: entry.lid,
      number: typeof entry.number === "string" ? entry.number : undefined,
      name: typeof entry.name === "string" ? entry.name : undefined,
      expiresAt: typeof entry.expiresAt === "string" ? entry.expiresAt : null,
      reason: typeof entry.reason === "string" ? entry.reason : null,
      createdAt: entry.createdAt,
      createdBy: entry.createdBy,
    }));
}

function normalizeBlockedCommands(entries: unknown): string[] {
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.toLowerCase());
}
