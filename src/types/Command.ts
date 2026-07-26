/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { proto, WASocket } from "baileys";
import { GroupCache } from "../cache/groupCache.js";
import type { Locale } from "../i18n/index.js";

export interface CommandDirectory {
  get(commandName: string): Command | undefined;
  listUnique(): Command[];
  listNames(): string[];
}

export const COMMAND_CATEGORIES = ["all", "geral", "grupo", "brincadeiras"] as const;
export type CommandCategory = typeof COMMAND_CATEGORIES[number];

export interface CommandContext {
  misa: WASocket;
  message: proto.IWebMessageInfo;
  args: string[];
  /** Texto bruto após o nome do comando, preservando quebras de linha */
  rawArgs: string;
  prefix: string;
  commandName: string;
  sender: string;
  from: string;
  groupCache: GroupCache;
  isOwner: () => Promise<boolean>;
  isGroup: boolean;
  isAdmin: () => Promise<boolean>;
  isBotAdmin: () => Promise<boolean>;
  commandDirectory: CommandDirectory;
  locale: Locale;
  t: (key: string, vars?: Record<string, string>) => string;
}

export interface Command {
  name: string;
  aliases?: string[];
  /** Aliases adicionais indexados por locale, registrados automaticamente */
  i18nAliases?: Partial<Record<Locale, string[]>>;
  description: string;
  category: CommandCategory;
  ownerOnly?: boolean;
  groupOnly?: boolean;
  privateOnly?: boolean;
  adminOnly?: boolean;
  botAdminRequired?: boolean;
  execute: (context: CommandContext) => Promise<void>;
}
