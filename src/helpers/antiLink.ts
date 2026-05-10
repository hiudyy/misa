/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { proto, WASocket } from "baileys";
import { getGroup, GroupData } from "../database/groupDB.js";
import { log } from "../logger.js";

type AntiLinkKey = "antilink" | "antilinkgp" | "antilinkch";

type AntiLinkMatch = {
  key: AntiLinkKey;
  tipo: "link" | "link de grupo" | "link de canal";
};

const GROUP_LINK_REGEX = /(?:https?:\/\/)?chat\.whatsapp\.com\/[a-z0-9]+/i;
const CHANNEL_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[a-z0-9]+/i;
const GENERIC_LINK_REGEX = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#][^\s]*)?\b/i;

function getDisplayName(message: proto.IWebMessageInfo): string {
  const pushName = message.pushName?.trim();
  if (pushName) return pushName;

  const participant = message.key?.participant || message.participant || "usuario";
  return participant.split("@")[0];
}

function buildPunishmentText(template: string, sender: string, nome: string, grupo: string, tipo: string): string {
  return template
    .replace(/@usuario/g, `@${sender.split("@")[0]}`)
    .replace(/@nome/g, nome)
    .replace(/@grupo/g, grupo)
    .replace(/@tipo/g, tipo);
}

function detectAntiLink(body: string, config: GroupData): AntiLinkMatch | null {
  if (config.antilinkgp.ativo && GROUP_LINK_REGEX.test(body)) {
    return { key: "antilinkgp", tipo: "link de grupo" };
  }

  if (config.antilinkch.ativo && CHANNEL_LINK_REGEX.test(body)) {
    return { key: "antilinkch", tipo: "link de canal" };
  }

  if (config.antilink.ativo && GENERIC_LINK_REGEX.test(body)) {
    return { key: "antilink", tipo: "link" };
  }

  return null;
}

export async function applyAntiLink(
  misa: WASocket,
  message: proto.IWebMessageInfo,
  groupId: string,
  sender: string,
): Promise<boolean> {
  const body =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    message.message?.imageMessage?.caption ||
    message.message?.videoMessage?.caption ||
    "";

  if (!body.trim()) return false;

  const config = await getGroup(groupId);
  const matched = detectAntiLink(body, config);
  if (!matched) return false;

  const groupMeta = await misa.groupMetadata(groupId).catch(() => null);
  const nome = getDisplayName(message);
  const grupo = groupMeta?.subject ?? "grupo";
  const antiConfig = config[matched.key];
  const texto = buildPunishmentText(antiConfig.texto, sender, nome, grupo, matched.tipo);

  if (message.key) {
    try {
      await misa.sendMessage(groupId, { delete: message.key });
    } catch (error) {
      log.warn("ANTILINK", `Nao foi possivel apagar a mensagem em ${groupId}: ${String(error)}`);
    }
  }

  if (antiConfig.punicao === "banir") {
    try {
      await misa.groupParticipantsUpdate(groupId, [sender], "remove");
    } catch (error) {
      log.warn("ANTILINK", `Nao foi possivel banir ${sender} em ${groupId}: ${String(error)}`);
    }
  }

  await misa.sendMessage(groupId, { text: texto, mentions: [sender] });
  return true;
}
