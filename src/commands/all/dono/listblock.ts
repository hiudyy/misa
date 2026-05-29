/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { cleanupExpiredBlockedUsers } from "../../../helpers/ownerRestrictions.js";
import { formatExpiresAt } from "../../../helpers/parseDuration.js";
import { Command } from "../../../types/Command.js";

const listblockCommand: Command = {
  name: "listblock",
  aliases: ["listblockuser", "listbanuserbot"],
  description: "Lista os usuários bloqueados no bot",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, t }) {
    const users = await cleanupExpiredBlockedUsers();

    if (users.length === 0) {
      await misa.sendMessage(from, { text: t("commands.listblock.empty") }, { quoted: message as WAMessage });
      return;
    }

    const lines = users.map((entry, index) => {
      const label = entry.number ? `@${entry.number}` : entry.lid;
      return `│ ${index + 1}. ${label}\n│ expira: ${formatExpiresAt(entry.expiresAt, t("commands.blockuser.permanent"))}\n│ motivo: ${entry.reason || t("common.none")}`;
    });

    await misa.sendMessage(
      from,
      { text: t("commands.listblock.header", { total: String(users.length), items: lines.join("\n│\n") }) },
      { quoted: message as WAMessage },
    );
  },
};

export default listblockCommand;
