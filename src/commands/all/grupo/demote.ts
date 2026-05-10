/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { toLID } from "../../../helpers/toLID.js";

const demoteCommand: Command = {
  name: "demote",
  aliases: ["rebaixar", "demover"],
  description: "Remove cargo de administrador de um membro",
  category: "all",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from }) {
    const mentionedIds = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    
    if (!mentionedIds || mentionedIds.length === 0) {
      await misa.sendMessage(
        from,
        { text: "❌ Mencione o administrador que deseja rebaixar.\n\nUso: demote @usuario" },
        { quoted: message as WAMessage },
      );
      return;
    }

    const userToDemote = await toLID(mentionedIds[0], misa);
    if (!userToDemote) {
      await misa.sendMessage(
        from,
        { text: "❌ Não foi possível resolver o LID do usuário mencionado." },
        { quoted: message as WAMessage },
      );
      return;
    }

    try {
      await misa.groupParticipantsUpdate(from, [userToDemote], "demote");
      
      await misa.sendMessage(
        from,
        {
          text: `✅ Administrador rebaixado a membro comum!`,
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        { text: `❌ Erro ao rebaixar administrador: ${String(error)}` },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default demoteCommand;
