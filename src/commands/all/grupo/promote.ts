/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const promoteCommand: Command = {
  name: "promote",
  aliases: ["promover", "admin"],
  description: "Promove um membro a administrador",
  category: "all",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from }) {
    const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    
    if (!mentionedJid || mentionedJid.length === 0) {
      await misa.sendMessage(
        from,
        { text: "❌ Mencione o usuário que deseja promover.\n\nUso: promote @usuario" },
        { quoted: message as WAMessage },
      );
      return;
    }

    const userToPromote = mentionedJid[0];

    try {
      await misa.groupParticipantsUpdate(from, [userToPromote], "promote");
      
      await misa.sendMessage(
        from,
        {
          text: `✅ Usuário promovido a administrador!`,
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        { text: `❌ Erro ao promover usuário: ${String(error)}` },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default promoteCommand;
