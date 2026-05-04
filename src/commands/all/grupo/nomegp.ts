/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const nomeGpCommand: Command = {
  name: "nomegp",
  aliases: ["nomegrup", "renamegp"],
  description: "Muda o nome do grupo",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: "❌ Informe o novo nome.\n\nUso: nomegp <nome>" },
        { quoted: message as WAMessage },
      );
      return;
    }

    const novoNome = args.join(" ");
    await misa.groupUpdateSubject(from, novoNome);
    await misa.sendMessage(
      from,
      { text: `✅ Nome do grupo alterado para *${novoNome}*!` },
      { quoted: message as WAMessage },
    );
  },
};

export default nomeGpCommand;
