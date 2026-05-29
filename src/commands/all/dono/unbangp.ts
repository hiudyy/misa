/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getGroup } from "../../../database/groupDB.js";
import { clearGroupBan } from "../../../helpers/ownerRestrictions.js";
import { Command } from "../../../types/Command.js";

const unbangpCommand: Command = {
  name: "unbangp",
  aliases: ["desbangp", "unbanggroup"],
  description: "Remove o bloqueio do bot no grupo atual",
  category: "geral",
  ownerOnly: true,
  groupOnly: true,
  async execute({ misa, message, from, t }) {
    const current = await getGroup(from);
    if (!current.botBan.ativo) {
      await misa.sendMessage(from, { text: t("commands.unbangp.notActive") }, { quoted: message as WAMessage });
      return;
    }

    await clearGroupBan(from);
    await misa.sendMessage(from, { text: t("commands.unbangp.disabled") }, { quoted: message as WAMessage });
  },
};

export default unbangpCommand;
