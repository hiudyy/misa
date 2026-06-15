/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getUserActivity } from "../../../helpers/groupActivity.js";
import { toLID } from "../../../helpers/toLID.js";
import { Command } from "../../../types/Command.js";

const rankAtivoCommand: Command = {
  name: "rankativo",
  aliases: ["ativos", "rankativos"],
  description: "Mostra o ranking dos membros mais ativos do grupo",
  category: "grupo",
  groupOnly: true,
  async execute({ misa, message, from, groupCache, t }) {
    const groupMeta = await groupCache.ensure(from, misa);

    if (!groupMeta) {
      await misa.sendMessage(from, { text: t("commands.rankativo.groupInfoFailed") }, { quoted: message as WAMessage });
      return;
    }

    const botLID = misa.user?.id ? await toLID(misa.user.id, misa) : null;
    const participants = groupMeta.participants.map((participant) => participant.id).filter((id) => id !== botLID);
    const entries = await Promise.all(participants.map((userId) => getUserActivity(from, userId)));
    const ranked = entries
      .filter((entry) => entry.total > 0)
      .sort((a, b) => b.total - a.total || b.messages - a.messages || b.commands - a.commands || b.stickers - a.stickers)
      .slice(0, 10);

    if (ranked.length === 0) {
      await misa.sendMessage(from, { text: t("commands.rankativo.empty") }, { quoted: message as WAMessage });
      return;
    }

    const items = ranked.map((entry, index) => t("commands.rankativo.item", {
      pos: String(index + 1),
      user: `@${entry.userId.split("@")[0]}`,
      total: String(entry.total),
      messages: String(entry.messages),
      commands: String(entry.commands),
      stickers: String(entry.stickers),
    }));

    await misa.sendMessage(
      from,
      {
        text: t("commands.rankativo.text", { items: items.join("\n") }),
        mentions: ranked.map((entry) => entry.userId),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default rankAtivoCommand;
