/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const descGpCommand: Command = {
  name: "descgp",
  aliases: ["descricao", "descricaogp"],
  description: "Muda a descrição do grupo",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: "❌ Informe a nova descrição.\n\nUso: descgp <descrição>" },
        { quoted: message as WAMessage },
      );
      return;
    }

    const novaDesc = args.join(" ");
    await misa.groupUpdateDescription(from, novaDesc);
    await misa.sendMessage(
      from,
      { text: `✅ Descrição do grupo atualizada!` },
      { quoted: message as WAMessage },
    );
  },
};

export default descGpCommand;
