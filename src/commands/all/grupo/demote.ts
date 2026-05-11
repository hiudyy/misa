/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { toLID } from "../../../helpers/toLID.js";

const demoteCommand: Command = {
  name: "demote",
  aliases: ["rebaixar", "demover", "degradar"],
  description: "Remove cargo de administrador de um membro",
  category: "all",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, t }) {
    const mentionedIds = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    
    if (!mentionedIds || mentionedIds.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.demote.noMention") },
        { quoted: message as WAMessage },
      );
      return;
    }

    const userToDemote = await toLID(mentionedIds[0], misa);
    if (!userToDemote) {
      await misa.sendMessage(
        from,
        { text: t("commands.demote.lidFailed") },
        { quoted: message as WAMessage },
      );
      return;
    }

    try {
      await misa.groupParticipantsUpdate(from, [userToDemote], "demote");
      
      await misa.sendMessage(
        from,
        {
          text: t("commands.demote.success"),
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        { text: t("commands.demote.error", { error: String(error) }) },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default demoteCommand;
