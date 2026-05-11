/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { proto, WASocket } from "baileys";
import { GroupCache } from "../cache/groupCache.js";
import type { Locale } from "../i18n/index.js";

export interface CommandContext {
  misa: WASocket;
  message: proto.IWebMessageInfo;
  args: string[];
  prefix: string;
  commandName: string;
  sender: string;
  from: string;
  groupCache: GroupCache;
  isOwner: () => Promise<boolean>;
  isGroup: boolean;
  isAdmin: () => Promise<boolean>;
  isBotAdmin: () => Promise<boolean>;
  locale: Locale;
  t: (key: string, vars?: Record<string, string>) => string;
}

export interface Command {
  name: string;
  aliases?: string[];
  /** Aliases adicionais indexados por locale, registrados automaticamente */
  i18nAliases?: Partial<Record<Locale, string[]>>;
  description: string;
  category: string;
  ownerOnly?: boolean;
  groupOnly?: boolean;
  privateOnly?: boolean;
  adminOnly?: boolean;
  botAdminRequired?: boolean;
  execute: (context: CommandContext) => Promise<void>;
}
