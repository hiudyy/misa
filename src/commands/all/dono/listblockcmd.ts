/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getOwnerConfig } from "../../../ownerConfig.js";
import { Command } from "../../../types/Command.js";

const listblockcmdCommand: Command = {
  name: "listblockcmd",
  aliases: ["listcmdblock", "listblockcommand"],
  description: "Lista os comandos bloqueados globalmente",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, t }) {
    const config = await getOwnerConfig();

    if (config.blockedCommands.length === 0) {
      await misa.sendMessage(from, { text: t("commands.listblockcmd.empty") }, { quoted: message as WAMessage });
      return;
    }

    const items = config.blockedCommands.map((command, index) => `│ ${index + 1}. ${command}`).join("\n");
    await misa.sendMessage(
      from,
      { text: t("commands.listblockcmd.header", { total: String(config.blockedCommands.length), items }) },
      { quoted: message as WAMessage },
    );
  },
};

export default listblockcmdCommand;
