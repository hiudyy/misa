/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { GroupMetadata, proto, WASocket } from "baileys";
import { GroupCache } from "../cache/groupCache.js";

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
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  category: string;
  ownerOnly?: boolean;
  groupOnly?: boolean;
  privateOnly?: boolean;
  adminOnly?: boolean;
  botAdminRequired?: boolean;
  execute: (context: CommandContext) => Promise<void>;
}
