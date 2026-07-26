/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import type { proto, WASocket } from "baileys";
import { toLID } from "./toLID.js";

function getContextInfo(message: proto.IWebMessageInfo): proto.IContextInfo | null {
  const content = message.message;
  return content?.extendedTextMessage?.contextInfo
    ?? content?.imageMessage?.contextInfo
    ?? content?.videoMessage?.contextInfo
    ?? content?.documentMessage?.contextInfo
    ?? content?.audioMessage?.contextInfo
    ?? null;
}

/** Returns a raw target JID, prioritizing an explicit mention over a quoted message. */
export function extractTargetUserJid(message: proto.IWebMessageInfo): string | null {
  const contextInfo = getContextInfo(message);
  const mentioned = contextInfo?.mentionedJid?.find(Boolean);
  if (mentioned) return mentioned;

  const isQuoted = Boolean(contextInfo?.quotedMessage || contextInfo?.stanzaId);
  if (!isQuoted) return null;
  if (contextInfo?.participant) return contextInfo.participant;

  const remoteJid = message.key?.remoteJid;
  if (remoteJid && !remoteJid.endsWith("@g.us")) return remoteJid;
  return null;
}

export async function resolveTargetUserLid(
  message: proto.IWebMessageInfo,
  socket: WASocket,
): Promise<{ rawJid: string; lid: string } | null> {
  const rawJid = extractTargetUserJid(message);
  if (!rawJid) return null;
  const lid = await toLID(rawJid, socket);
  return lid ? { rawJid, lid } : null;
}
