/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const adminsCommand: Command = {
  name: "admins",
  aliases: ["adms", "chamaradm", "administradores"],
  description: "Menciona todos os admins do grupo",
  category: "grupo",
  groupOnly: true,
  async execute({ misa, message, from, args, groupCache, t }) {
    const groupMeta = await groupCache.ensure(from, misa);

    if (!groupMeta) {
      await misa.sendMessage(from, { text: t("commands.admins.fetchError") }, { quoted: message as WAMessage });
      return;
    }

    const admins = groupMeta.participants.filter((p) => p.admin === "admin" || p.admin === "superadmin");

    if (admins.length === 0) {
      await misa.sendMessage(from, { text: t("commands.admins.noneFound") }, { quoted: message as WAMessage });
      return;
    }

    const mencoes = admins.map((a) => `@${a.id.split("@")[0]}`).join(" ");
    const texto = args.length > 0 ? args.join(" ") : t("commands.admins.called");

    await misa.sendMessage(
      from,
      {
        text: `${mencoes}\n\n${texto}`,
        mentions: admins.map((a) => a.id),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default adminsCommand;
