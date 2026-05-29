/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const delCommand: Command = {
  name: "del",
  aliases: ["delete", "apagar"],
  description: "Deleta uma mensagem do grupo (responda a mensagem)",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  async execute({ misa, message, from, t }) {
    // Get the quoted message
    const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedKey = message.message?.extendedTextMessage?.contextInfo?.remoteJid;
    const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
    const quotedMessageId = message.message?.extendedTextMessage?.contextInfo?.stanzaId;

    if (!quotedMsg || !quotedMessageId) {
      await misa.sendMessage(
        from,
        { text: t("commands.del.noQuoted") },
        { quoted: message as WAMessage },
      );
      return;
    }

    try {
      // Delete the quoted message
      await misa.sendMessage(from, {
        delete: {
          remoteJid: from,
          id: quotedMessageId,
          participant: quotedParticipant || undefined,
        },
      });

      await misa.sendMessage(
        from,
        { text: t("commands.del.success") },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        { text: t("commands.del.error", { error: String(error) }) },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default delCommand;
