/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { proto } from "baileys";
import { getGroup, saveGroup } from "../database/groupDB.js";
import { getOwnerConfig, updateOwnerConfig, type BlockedUserEntry } from "../ownerConfig.js";
import { extractTargetUserJid } from "./targetUser.js";

export async function cleanupExpiredBlockedUsers(): Promise<BlockedUserEntry[]> {
  const now = Date.now();
  const updated = await updateOwnerConfig((current) => ({
    ...current,
    blockedUsers: current.blockedUsers.filter((entry) => {
      if (!entry.expiresAt) return true;
      const expiresAt = new Date(entry.expiresAt).getTime();
      return Number.isNaN(expiresAt) || expiresAt > now;
    }),
  }));
  return updated.blockedUsers;
}

export async function isBlockedUser(userLID: string): Promise<boolean> {
  const active = await cleanupExpiredBlockedUsers();
  return active.some((entry) => entry.lid === userLID);
}

export async function isBlockedCommand(commandName: string): Promise<boolean> {
  const config = await getOwnerConfig();
  return config.blockedCommands.includes(commandName.toLowerCase());
}

export async function setGroupBan(groupId: string, createdBy: string, reason?: string): Promise<void> {
  await saveGroup(groupId, {
    botBan: {
      ativo: true,
      motivo: reason?.trim() || null,
      createdAt: new Date().toISOString(),
      createdBy,
    },
  });
}

export async function clearGroupBan(groupId: string): Promise<void> {
  await saveGroup(groupId, {
    botBan: {
      ativo: false,
      motivo: null,
      createdAt: null,
      createdBy: null,
    },
  });
}

export async function isGroupBanned(groupId: string): Promise<boolean> {
  const group = await getGroup(groupId);
  return group.botBan.ativo;
}

export function extractMentionedUser(message: proto.IWebMessageInfo): string | null {
  return extractTargetUserJid(message);
}

export function findBlockedUser(entries: BlockedUserEntry[], userLID: string): BlockedUserEntry | null {
  return entries.find((entry) => entry.lid === userLID) ?? null;
}
