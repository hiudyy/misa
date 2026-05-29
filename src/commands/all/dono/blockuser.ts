/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { toLID } from "../../../helpers/toLID.js";
import { extractMentionedUser, cleanupExpiredBlockedUsers, findBlockedUser } from "../../../helpers/ownerRestrictions.js";
import { formatExpiresAt, isDurationToken, parseDurationMs } from "../../../helpers/parseDuration.js";
import { getOwnerConfig, saveOwnerConfig } from "../../../ownerConfig.js";
import { Command } from "../../../types/Command.js";

const blockuserCommand: Command = {
  name: "blockuser",
  aliases: ["bloquearuser", "banuserbot"],
  description: "Bloqueia um usuário globalmente no bot",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, sender, t }) {
    const mentioned = extractMentionedUser(message);
    if (!mentioned) {
      await misa.sendMessage(from, { text: t("commands.blockuser.noMention") }, { quoted: message as WAMessage });
      return;
    }

    const userLID = await toLID(mentioned, misa);
    if (!userLID) {
      await misa.sendMessage(from, { text: t("commands.blockuser.lidFailed") }, { quoted: message as WAMessage });
      return;
    }

    if (userLID === sender) {
      await misa.sendMessage(from, { text: t("commands.blockuser.ownerBypass") }, { quoted: message as WAMessage });
      return;
    }

    const config = await getOwnerConfig();
    const activeUsers = await cleanupExpiredBlockedUsers();
    if (findBlockedUser(activeUsers, userLID)) {
      await misa.sendMessage(from, { text: t("commands.blockuser.alreadyBlocked") }, { quoted: message as WAMessage });
      return;
    }

    const mentionIndex = args.findIndex((arg) => arg.startsWith("@"));
    const baseIndex = mentionIndex >= 0 ? mentionIndex + 1 : 0;
    const durationArg = args[baseIndex];

    const durationMs = isDurationToken(durationArg) ? parseDurationMs(durationArg!) : null;
    const expiresAt = durationMs ? new Date(Date.now() + durationMs).toISOString() : null;
    const reasonIndex = durationMs ? baseIndex + 1 : baseIndex;
    const reason = args.slice(reasonIndex).join(" ").trim() || null;

    config.blockedUsers = [
      ...activeUsers,
      {
        lid: userLID,
        number: mentioned.replace(/\D/g, ""),
        name: message.pushName?.trim() || undefined,
        expiresAt,
        reason,
        createdAt: new Date().toISOString(),
        createdBy: sender,
      },
    ];

    await saveOwnerConfig(config);

    await misa.sendMessage(
      from,
      {
        text: t("commands.blockuser.success", {
          user: `@${mentioned.split("@")[0]}`,
          expires: formatExpiresAt(expiresAt, t("commands.blockuser.permanent")),
          reason: reason || t("common.none"),
        }),
        mentions: [userLID],
      },
      { quoted: message as WAMessage },
    );
  },
};

export default blockuserCommand;
