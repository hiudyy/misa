/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { toLID } from "../../../helpers/toLID.js";

const promoteCommand: Command = {
  name: "promote",
  aliases: ["promover", "admin"],
  description: "Promove um membro a administrador",
  category: "all",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from }) {
    const mentionedIds = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    
    if (!mentionedIds || mentionedIds.length === 0) {
      await misa.sendMessage(
        from,
        { text: "❌ Mencione o usuário que deseja promover.\n\nUso: promote @usuario" },
        { quoted: message as WAMessage },
      );
      return;
    }

    const userToPromote = await toLID(mentionedIds[0], misa);
    if (!userToPromote) {
      await misa.sendMessage(
        from,
        { text: "❌ Não foi possível resolver o LID do usuário mencionado." },
        { quoted: message as WAMessage },
      );
      return;
    }

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
