/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { toLID } from "../../../helpers/toLID.js";
import { extractTargetUserJid } from "../../../helpers/targetUser.js";

const promoteCommand: Command = {
  name: "promote",
  aliases: ["promover", "admin"],
  description: "Promotes a member to administrator",
  category: "all",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, t }) {
    const targetJid = extractTargetUserJid(message);
    
    if (!targetJid) {
      await misa.sendMessage(
        from,
        { text: t("commands.promote.noMention") },
        { quoted: message as WAMessage },
      );
      return;
    }

    const userToPromote = await toLID(targetJid, misa);
    if (!userToPromote) {
      await misa.sendMessage(
        from,
        { text: t("commands.promote.lidFailed") },
        { quoted: message as WAMessage },
      );
      return;
    }

    try {
      await misa.groupParticipantsUpdate(from, [userToPromote], "promote");
      
      await misa.sendMessage(
        from,
        {
          text: t("commands.promote.success"),
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        { text: t("commands.promote.error", { error: String(error) }) },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default promoteCommand;
