/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { paths } from "./config/paths.js";
import { DEFAULT_LOCALE, t } from "./i18n/index.js";
import { readJson, updateJson, writeJson } from "./storage/jsonStore.js";

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

export const defaultOwnerConfig: OwnerConfig = {
  comandoNaoEncontrado: {
    modo: "texto",
    texto: t("owner.cmdnf.defaultText", DEFAULT_LOCALE),
  },
  antiPrivate: false,
  blockedUsers: [],
  blockedCommands: [],
};

let ownerConfigCache: OwnerConfig | null = null;
let ownerConfigLoad: Promise<OwnerConfig> | null = null;

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

export function normalizeOwnerConfig(value: unknown): OwnerConfig {
  const input = asObject(value);
  const unknownCommand = asObject(input.comandoNaoEncontrado);
  return {
    comandoNaoEncontrado: {
      modo: unknownCommand.modo === "mencao" ? "mencao" : "texto",
      texto: typeof unknownCommand.texto === "string" && unknownCommand.texto.trim()
        ? unknownCommand.texto
        : defaultOwnerConfig.comandoNaoEncontrado.texto,
    },
    antiPrivate: typeof input.antiPrivate === "boolean" ? input.antiPrivate : false,
    blockedUsers: normalizeBlockedUsers(input.blockedUsers),
    blockedCommands: normalizeBlockedCommands(input.blockedCommands),
  };
}

export async function getOwnerConfig(): Promise<OwnerConfig> {
  if (ownerConfigCache) return structuredClone(ownerConfigCache);
  ownerConfigLoad ??= readJson(paths.ownerConfig, { defaultValue: defaultOwnerConfig, normalize: normalizeOwnerConfig })
    .then((config) => {
      ownerConfigCache = structuredClone(config);
      return config;
    })
    .finally(() => {
      ownerConfigLoad = null;
    });
  return structuredClone(await ownerConfigLoad);
}

export async function saveOwnerConfig(config: OwnerConfig): Promise<void> {
  const normalized = normalizeOwnerConfig(config);
  await writeJson(paths.ownerConfig, normalized);
  ownerConfigCache = structuredClone(normalized);
}

export async function updateOwnerConfig(
  update: (current: OwnerConfig) => OwnerConfig | Promise<OwnerConfig>,
): Promise<OwnerConfig> {
  const updated = await updateJson(paths.ownerConfig, { defaultValue: defaultOwnerConfig, normalize: normalizeOwnerConfig }, update);
  ownerConfigCache = structuredClone(updated);
  return structuredClone(updated);
}

export function clearOwnerConfigCache(): void {
  ownerConfigCache = null;
  ownerConfigLoad = null;
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
  return [...new Set(entries
    .filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()))
    .map((entry) => entry.trim().toLowerCase()))];
}
