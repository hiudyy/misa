/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { toLID } from "../../../helpers/toLID.js";
import { extractMentionedUser, cleanupExpiredBlockedUsers } from "../../../helpers/ownerRestrictions.js";
import { getOwnerConfig, saveOwnerConfig } from "../../../ownerConfig.js";
import { Command } from "../../../types/Command.js";

const unblockuserCommand: Command = {
  name: "unblockuser",
  aliases: ["desbloquearuser", "unbanuserbot"],
  description: "Remove o bloqueio global de um usuário",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, t }) {
    const mentioned = extractMentionedUser(message);
    if (!mentioned) {
      await misa.sendMessage(from, { text: t("commands.unblockuser.noMention") }, { quoted: message as WAMessage });
      return;
    }

    const userLID = await toLID(mentioned, misa);
    if (!userLID) {
      await misa.sendMessage(from, { text: t("commands.unblockuser.lidFailed") }, { quoted: message as WAMessage });
      return;
    }

    const config = await getOwnerConfig();
    const activeUsers = await cleanupExpiredBlockedUsers();
    const nextUsers = activeUsers.filter((entry) => entry.lid !== userLID);

    if (nextUsers.length === activeUsers.length) {
      await misa.sendMessage(from, { text: t("commands.unblockuser.notBlocked") }, { quoted: message as WAMessage });
      return;
    }

    config.blockedUsers = nextUsers;
    await saveOwnerConfig(config);

    await misa.sendMessage(
      from,
      { text: t("commands.unblockuser.success", { user: `@${mentioned.split("@")[0]}` }), mentions: [userLID] },
      { quoted: message as WAMessage },
    );
  },
};

export default unblockuserCommand;
