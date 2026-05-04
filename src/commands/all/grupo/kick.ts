/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const kickCommand: Command = {
  name: "kick",
  aliases: ["ban", "remover"],
  description: "Remove um membro do grupo",
  category: "all",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from }) {
    const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    
    if (!mentionedJid || mentionedJid.length === 0) {
      await misa.sendMessage(
        from,
        { text: "❌ Mencione o usuário que deseja remover.\n\nUso: kick @usuario" },
        { quoted: message as WAMessage },
      );
      return;
    }

    const userToKick = mentionedJid[0];

    try {
      await misa.groupParticipantsUpdate(from, [userToKick], "remove");
      
      await misa.sendMessage(
        from,
        {
          text: `✅ Usuário removido com sucesso!`,
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        { text: `❌ Erro ao remover usuário: ${String(error)}` },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default kickCommand;
