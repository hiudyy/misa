import { WAMessage } from "baileys";
import { getBotConfig } from "../../../config.js";
import { getOwnerConfig } from "../../../ownerConfig.js";
import { listBannedGroups } from "../../../database/groupDB.js";
import { cleanupExpiredBlockedUsers } from "../../../helpers/ownerRestrictions.js";
import { listStoredGroupIds } from "../../../helpers/listGroups.js";
import { Command } from "../../../types/Command.js";

function formatUptime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return [days ? `${days}d` : null, hours ? `${hours}h` : null, minutes ? `${minutes}m` : null, `${seconds}s`]
    .filter(Boolean)
    .join(" ");
}

const statusbotCommand: Command = {
  name: "statusbot",
  aliases: ["botstatus", "statusmisa"],
  description: "Mostra o status geral do bot",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, t }) {
    const [botConfig, ownerConfig, blockedUsers, bannedGroups, storedGroups] = await Promise.all([
      getBotConfig(),
      getOwnerConfig(),
      cleanupExpiredBlockedUsers(),
      listBannedGroups(),
      listStoredGroupIds(),
    ]);

    await misa.sendMessage(
      from,
      {
        text: t("commands.statusbot.text", {
          bot: botConfig.botName,
          owner: botConfig.ownerName,
          ownerNumber: botConfig.ownerNumber || t("common.none"),
          prefix: botConfig.prefix,
          language: botConfig.language,
          autoUpdate: botConfig.autoUpdate ? t("common.enabled") : t("common.disabled"),
          antiPrivate: ownerConfig.antiPrivate ? t("common.enabled") : t("common.disabled"),
          blockedUsers: String(blockedUsers.length),
          blockedCommands: String(ownerConfig.blockedCommands.length),
          bannedGroups: String(bannedGroups.length),
          groups: String(storedGroups.length),
          uptime: formatUptime(process.uptime()),
          user: misa.user?.id || t("common.unknown"),
        }),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default statusbotCommand;
