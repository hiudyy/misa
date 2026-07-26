/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { toLID } from "../../../helpers/toLID.js";
import { extractTargetUserJid } from "../../../helpers/targetUser.js";

const demoteCommand: Command = {
  name: "demote",
  aliases: ["rebaixar", "demover", "degradar"],
  description: "Remove administrator role from a member",
  category: "all",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, t }) {
    const targetJid = extractTargetUserJid(message);
    
    if (!targetJid) {
      await misa.sendMessage(
        from,
        { text: t("commands.demote.noMention") },
        { quoted: message as WAMessage },
      );
      return;
    }

    const userToDemote = await toLID(targetJid, misa);
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
