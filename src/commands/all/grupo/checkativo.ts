/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getUserActivity } from "../../../helpers/groupActivity.js";
import { toLID } from "../../../helpers/toLID.js";
import { Command } from "../../../types/Command.js";

const checkAtivoCommand: Command = {
  name: "checkativo",
  aliases: ["atividade", "checkatividade"],
  description: "Mostra a atividade de um membro do grupo",
  category: "grupo",
  groupOnly: true,
  async execute({ misa, message, from, sender, groupCache, t }) {
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const target = mentioned ? await toLID(mentioned, misa) : sender;

    if (!target) {
      await misa.sendMessage(from, { text: t("commands.checkativo.lidFailed") }, { quoted: message as WAMessage });
      return;
    }

    const groupMeta = await groupCache.ensure(from, misa);
    const participants = groupMeta?.participants.map((participant) => participant.id) ?? [];
    const entries = await Promise.all(participants.map((userId) => getUserActivity(from, userId)));
    const ranked = entries.sort((a, b) => b.total - a.total || b.messages - a.messages || b.commands - a.commands || b.stickers - a.stickers);
    const position = ranked.findIndex((entry) => entry.userId === target) + 1;
    const stats = await getUserActivity(from, target);

    await misa.sendMessage(
      from,
      {
        text: t("commands.checkativo.text", {
          user: `@${target.split("@")[0]}`,
          total: String(stats.total),
          messages: String(stats.messages),
          commands: String(stats.commands),
          stickers: String(stats.stickers),
          position: position > 0 ? `#${position}` : t("common.none"),
        }),
        mentions: [target],
      },
      { quoted: message as WAMessage },
    );
  },
};

export default checkAtivoCommand;
