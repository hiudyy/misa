/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getOwnerConfig, saveOwnerConfig } from "../../../ownerConfig.js";
import { Command } from "../../../types/Command.js";

const unblockcmdCommand: Command = {
  name: "unblockcmd",
  aliases: ["desbloquearcmd", "unblockcommand"],
  description: "Remove o bloqueio global de um comando",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, commandDirectory, t }) {
    const input = args[0]?.toLowerCase();
    if (!input) {
      await misa.sendMessage(from, { text: t("commands.unblockcmd.noArgs") }, { quoted: message as WAMessage });
      return;
    }

    const command = commandDirectory.get(input);
    if (!command) {
      await misa.sendMessage(from, { text: t("commands.unblockcmd.notFound", { command: input }) }, { quoted: message as WAMessage });
      return;
    }

    const config = await getOwnerConfig();
    const nextCommands = config.blockedCommands.filter((name) => name !== command.name);

    if (nextCommands.length === config.blockedCommands.length) {
      await misa.sendMessage(from, { text: t("commands.unblockcmd.notBlocked", { command: command.name }) }, { quoted: message as WAMessage });
      return;
    }

    config.blockedCommands = nextCommands;
    await saveOwnerConfig(config);

    await misa.sendMessage(from, { text: t("commands.unblockcmd.success", { command: command.name }) }, { quoted: message as WAMessage });
  },
};

export default unblockcmdCommand;
