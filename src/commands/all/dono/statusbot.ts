/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig } from "../../../config.js";
import { getOwnerConfig } from "../../../ownerConfig.js";
import { listBannedGroups } from "../../../database/groupDB.js";
import { cleanupExpiredBlockedUsers } from "../../../helpers/ownerRestrictions.js";
import { listStoredGroupIds } from "../../../helpers/listGroups.js";
import { getLocaleLabel } from "../../../i18n/index.js";
import { Command } from "../../../types/Command.js";
import { metrics } from "../../../metrics.js";
import { mediaQueue } from "../../../media/mediaQueue.js";
import { ffmpegLimiter } from "../../../media/ffmpegLimiter.js";
import {
  averageDuration,
  cacheHitRate,
  formatMetricBytes,
  formatMetricDuration,
  topFailures,
} from "../../../helpers/metricsFormatting.js";
import { getBuildInfo } from "../../../version.js";

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
  i18nAliases: {
    en: ["botstatus", "statusbot"],
    es: ["estadobot", "statusbot"],
    id: ["statusbot", "statusmesin"],
  },
  description: "Shows overall bot status",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, t }) {
    const [botConfig, ownerConfig, blockedUsers, bannedGroups, storedGroups, buildInfo] = await Promise.all([
      getBotConfig(),
      getOwnerConfig(),
      cleanupExpiredBlockedUsers(),
      listBannedGroups(),
      listStoredGroupIds(),
      getBuildInfo(),
    ]);
    const snapshot = metrics.snapshot();
    const queue = mediaQueue.snapshot();
    const memory = process.memoryUsage();
    const usage = process.resourceUsage();
    const metricsSection = t("commands.statusMetrics.text", {
      messages: String(snapshot.messages.processed),
      messageErrors: String(snapshot.messages.failed),
      messageActive: String(snapshot.messages.active),
      messagePending: String(snapshot.messages.pending),
      messageDropped: String(snapshot.messages.dropped),
      messageTimeouts: String(snapshot.messages.timedOut),
      commands: String(snapshot.commands.started),
      commandErrors: String(snapshot.commands.failure),
      denied: String(snapshot.commands.denied),
      mediaSuccess: String(snapshot.media.success),
      mediaErrors: String(snapshot.media.failure),
      mediaBytes: formatMetricBytes(snapshot.media.bytes),
      active: String(queue.active),
      pending: String(queue.pending),
      ffmpeg: String(ffmpegLimiter.active),
      cacheRate: cacheHitRate(snapshot.caches),
      reconnects: String(snapshot.reconnects),
      avgCommand: formatMetricDuration(averageDuration(snapshot.commandStats)),
      avgMedia: formatMetricDuration(averageDuration(snapshot.mediaStats)),
      rss: formatMetricBytes(memory.rss),
      heap: formatMetricBytes(memory.heapUsed),
      cpu: formatMetricDuration((usage.userCPUTime + usage.systemCPUTime) / 1_000),
      commandFailures: topFailures(snapshot.commandStats),
      providerFailures: topFailures(snapshot.providers),
    });
    const versionSection = t("commands.statusVersion.text", {
      version: buildInfo.version,
      commit: buildInfo.commit,
      schema: String(buildInfo.schemaVersion),
    });

    await misa.sendMessage(
      from,
      {
        text: `${t("commands.statusbot.text", {
          bot: botConfig.botName,
          owner: botConfig.ownerName,
          ownerNumber: botConfig.ownerNumber || t("common.none"),
          prefix: botConfig.prefix,
          language: getLocaleLabel(botConfig.language),
          autoUpdate: botConfig.autoUpdate ? t("common.enabled") : t("common.disabled"),
          antiPrivate: ownerConfig.antiPrivate ? t("common.enabled") : t("common.disabled"),
          blockedUsers: String(blockedUsers.length),
          blockedCommands: String(ownerConfig.blockedCommands.length),
          bannedGroups: String(bannedGroups.length),
          groups: String(storedGroups.length),
          uptime: formatUptime(process.uptime()),
          user: misa.user?.id || t("common.unknown"),
        })}\n\n${versionSection}\n\n${metricsSection}`,
      },
      { quoted: message as WAMessage },
    );
  },
};

export default statusbotCommand;
