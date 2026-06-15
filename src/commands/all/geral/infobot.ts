/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig } from "../../../config.js";
import { getLocaleLabel } from "../../../i18n/index.js";
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

function formatMemory(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const infobotCommand: Command = {
  name: "infobot",
  aliases: ["botinfo", "info", "sobrebot"],
  description: "Mostra as informacoes do bot",
  category: "geral",
  async execute({ misa, message, from, t }) {
    const config = await getBotConfig();

    await misa.sendMessage(
      from,
      {
        text: t("commands.infobot.text", {
          bot: config.botName,
          owner: config.ownerName,
          prefix: config.prefix,
          language: getLocaleLabel(config.language),
          uptime: formatUptime(process.uptime()),
          memory: formatMemory(process.memoryUsage().rss),
          node: process.version,
        }),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default infobotCommand;
