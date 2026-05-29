/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getOwnerConfig, saveOwnerConfig } from "../../../ownerConfig.js";
import { Command } from "../../../types/Command.js";

const blockcmdCommand: Command = {
  name: "blockcmd",
  aliases: ["bloquearcmd", "blockcommand"],
  description: "Bloqueia um comando globalmente para não-donos",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, commandDirectory, t }) {
    const input = args[0]?.toLowerCase();
    if (!input) {
      await misa.sendMessage(from, { text: t("commands.blockcmd.noArgs") }, { quoted: message as WAMessage });
      return;
    }

    const command = commandDirectory.get(input);
    if (!command) {
      await misa.sendMessage(from, { text: t("commands.blockcmd.notFound", { command: input }) }, { quoted: message as WAMessage });
      return;
    }

    const config = await getOwnerConfig();
    if (config.blockedCommands.includes(command.name)) {
      await misa.sendMessage(from, { text: t("commands.blockcmd.alreadyBlocked", { command: command.name }) }, { quoted: message as WAMessage });
      return;
    }

    config.blockedCommands = [...config.blockedCommands, command.name].sort();
    await saveOwnerConfig(config);

    await misa.sendMessage(from, { text: t("commands.blockcmd.success", { command: command.name }) }, { quoted: message as WAMessage });
  },
};

export default blockcmdCommand;
