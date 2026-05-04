/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";

function formatUptime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts = [
    days > 0 ? `${days}d` : null,
    hours > 0 ? `${hours}h` : null,
    minutes > 0 ? `${minutes}m` : null,
    `${seconds}s`,
  ].filter(Boolean);

  return parts.join(" ");
}

function formatMemory(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const pingCommand: Command = {
  name: "ping",
  aliases: ["p"],
  description: "Mostra se a bot esta respondendo",
  category: "all",
  async execute({ misa, message, from, isOwner }) {
    const config = await getBotConfig();
    const messageTimestamp = Number(message.messageTimestamp ?? 0);
    const latency = messageTimestamp > 0 ? Math.max(0, Date.now() - messageTimestamp * 1000) : null;
    const latencyText = latency === null ? "indisponivel" : `${latency}ms`;
    const uptime = formatUptime(process.uptime());
    const ramUsage = formatMemory(process.memoryUsage().rss);
    const userIsOwner = await isOwner();

    await misa.sendMessage(
      from,
      {
        text: [
          `╭─「 *${config.botName}* 」`,
          "│",
          `│ ✦ Latencia: ${latencyText}`,
          `│ ✦ Ativa ha: ${uptime}`,
          `│ ✦ Memoria: ${ramUsage}`,
          userIsOwner ? `│ ✦ Status: Dono` : "",
          "│",
          "╰─ Powered By Misa.",
        ].filter(Boolean).join("\n"),
      },
      { quoted: message as WAMessage },
    );
  },
};;

export default pingCommand;
