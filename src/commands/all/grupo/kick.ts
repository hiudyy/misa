/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { toLID } from "../../../helpers/toLID.js";
import { extractTargetUserJid } from "../../../helpers/targetUser.js";

const kickCommand: Command = {
  name: "kick",
  aliases: ["ban", "remover", "expulsar"],
  description: "Removes a member from the group",
  category: "all",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, t }) {
    const targetJid = extractTargetUserJid(message);
    
    if (!targetJid) {
      await misa.sendMessage(
        from,
        { text: t("commands.kick.noMention") },
        { quoted: message as WAMessage },
      );
      return;
    }

    const userToKick = await toLID(targetJid, misa);
    if (!userToKick) {
      await misa.sendMessage(
        from,
        { text: t("commands.kick.lidFailed") },
        { quoted: message as WAMessage },
      );
      return;
    }

    try {
      await misa.groupParticipantsUpdate(from, [userToKick], "remove");
      
      await misa.sendMessage(
        from,
        {
          text: t("commands.kick.success"),
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        { text: t("commands.kick.error", { error: String(error) }) },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default kickCommand;
