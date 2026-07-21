/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const descGpCommand: Command = {
  name: "descgp",
  aliases: ["descricao", "descricaogp", "groupdesc", "descgrupo"],
  description: "Changes the group description",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args, rawArgs, t }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.descgp.noArgs") },
        { quoted: message as WAMessage },
      );
      return;
    }

    const novaDesc = rawArgs;
    await misa.groupUpdateDescription(from, novaDesc);
    await misa.sendMessage(
      from,
      { text: t("commands.descgp.success") },
      { quoted: message as WAMessage },
    );
  },
};

export default descGpCommand;
