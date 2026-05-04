/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WASocket } from "baileys";
import { groupCache } from "../cache/groupCache.js";

export async function isAdmin(groupId: string, userId: string, misa: WASocket): Promise<boolean> {
  if (!groupId.endsWith("@g.us")) {
    return false;
  }

  const groupMetadata = await groupCache.ensure(groupId, misa);
  if (!groupMetadata) {
    return false;
  }

  const participant = groupMetadata.participants.find((p) => p.id === userId);
  if (!participant) {
    return false;
  }

  return participant.admin === "admin" || participant.admin === "superadmin";
}

export async function isBotAdmin(groupId: string, misa: WASocket): Promise<boolean> {
  if (!groupId.endsWith("@g.us")) {
    return false;
  }

  const groupMetadata = await groupCache.ensure(groupId, misa);
  if (!groupMetadata) {
    return false;
  }

  const botId = misa.user?.id;
  if (!botId) {
    return false;
  }

  const participant = groupMetadata.participants.find((p) => p.id === botId);
  if (!participant) {
    return false;
  }

  return participant.admin === "admin" || participant.admin === "superadmin";
}
