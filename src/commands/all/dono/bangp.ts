/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getGroup } from "../../../database/groupDB.js";
import { setGroupBan } from "../../../helpers/ownerRestrictions.js";
import { Command } from "../../../types/Command.js";

const bangpCommand: Command = {
  name: "bangp",
  aliases: ["bangrupo", "banggroup"],
  description: "Bloqueia o bot no grupo atual para todos, exceto o dono",
  category: "geral",
  ownerOnly: true,
  groupOnly: true,
  async execute({ misa, message, from, args, sender, t }) {
    const current = await getGroup(from);
    if (current.botBan.ativo) {
      await misa.sendMessage(from, { text: t("commands.bangp.alreadyActive") }, { quoted: message as WAMessage });
      return;
    }

    const reason = args.join(" ").trim();
    await setGroupBan(from, sender, reason);

    await misa.sendMessage(
      from,
      { text: t("commands.bangp.enabled", { reason: reason || t("common.none") }) },
      { quoted: message as WAMessage },
    );
  },
};

export default bangpCommand;
