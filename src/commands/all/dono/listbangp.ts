/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { listBannedGroups } from "../../../database/groupDB.js";
import { Command } from "../../../types/Command.js";

const listbangpCommand: Command = {
  name: "listbangp",
  aliases: ["bangplist", "listbangroup"],
  description: "Lista os grupos onde o bot está bloqueado",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, t, locale }) {
    const groups = await listBannedGroups();

    if (groups.length === 0) {
      await misa.sendMessage(from, { text: t("commands.listbangp.empty") }, { quoted: message as WAMessage });
      return;
    }

    const lines = groups.map(({ groupId, data }, index) => {
      const reason = data.botBan.motivo || t("common.none");
      const createdAt = data.botBan.createdAt
        ? new Date(data.botBan.createdAt).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })
        : t("common.unknown");

      return [
        `│ ${index + 1}. ${groupId}`,
        `│ ${t("commands.listbangp.reasonLabel")}: ${reason}`,
        `│ ${t("commands.listbangp.sinceLabel")}: ${createdAt}`,
      ].join("\n");
    });

    await misa.sendMessage(
      from,
      { text: t("commands.listbangp.header", { total: String(groups.length), items: lines.join("\n│\n") }) },
      { quoted: message as WAMessage },
    );
  },
};

export default listbangpCommand;
