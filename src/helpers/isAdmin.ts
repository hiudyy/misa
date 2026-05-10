/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { GroupParticipant, WASocket } from "baileys";
import { groupCache } from "../cache/groupCache.js";
import { toLID } from "./toLID.js";

function isGroupAdmin(admin?: string | null): boolean {
  return admin === "admin" || admin === "superadmin";
}

async function findParticipant(
  participants: GroupParticipant[],
  userId: string,
  misa: WASocket,
): Promise<GroupParticipant | null> {
  const userLID = await toLID(userId, misa);
  if (!userLID) return null;

  for (const participant of participants) {
    const participantLID = await toLID(participant.id, misa);
    if (participantLID === userLID) {
      return participant;
    }
  }

  return null;
}

export async function isAdmin(groupId: string, userId: string, misa: WASocket): Promise<boolean> {
  if (!groupId.endsWith("@g.us")) {
    return false;
  }

  const groupMetadata = await groupCache.ensure(groupId, misa);
  if (!groupMetadata) {
    return false;
  }

  const participant = await findParticipant(groupMetadata.participants, userId, misa);
  if (!participant) {
    return false;
  }

  return isGroupAdmin(participant.admin);
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

  const participant = await findParticipant(groupMetadata.participants, botId, misa);
  if (!participant) {
    return false;
  }

  return isGroupAdmin(participant.admin);
}
