/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { proto, WAMessage, WASocket } from "baileys";
import { getGroup, type GroupData } from "../database/groupDB.js";
import type { Locale } from "../i18n/index.js";

type MediaRestrictionKey = keyof GroupData["antimidia"];

function detectRestrictedMedia(message: proto.IWebMessageInfo, config: GroupData): MediaRestrictionKey | null {
  const content = message.message;
  if (!content) return null;

  if (config.antimidia.loc && content.locationMessage) return "loc";
  if (config.antimidia.audio && content.audioMessage) return "audio";
  if (config.antimidia.foto && content.imageMessage) return "foto";
  if (config.antimidia.video && content.videoMessage) return "video";
  if (config.antimidia.doc && content.documentMessage) return "doc";
  if (config.antimidia.lista && (content.listMessage || content.listResponseMessage || content.interactiveMessage || content.interactiveResponseMessage)) {
    return "lista";
  }

  return null;
}

export async function applyMediaRestriction(
  misa: WASocket,
  message: proto.IWebMessageInfo,
  groupId: string,
  sender: string,
  locale: Locale,
): Promise<boolean> {
  const config = await getGroup(groupId);
  const blockedType = detectRestrictedMedia(message, config);
  if (!blockedType || !message.key) return false;

  const { t } = await import("../i18n/index.js");
  await misa.sendMessage(groupId, { delete: message.key });
  await misa.sendMessage(
    groupId,
    {
      text: t("commands.antimidia.blocked", locale, {
        user: `@${sender.split("@")[0]}`,
        type: t(`commands.antimidia.types.${blockedType}`, locale),
      }),
      mentions: [sender],
    },
    { quoted: message as WAMessage },
  );

  return true;
}
