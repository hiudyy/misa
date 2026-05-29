/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig, saveBotConfig } from "../../../config.js";
import { Command } from "../../../types/Command.js";

const nomebotCommand: Command = {
  name: "nomebot",
  aliases: ["botname", "setbotname"],
  description: "Atualiza o nome do bot",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, t }) {
    const config = await getBotConfig();

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.nomebot.current", { value: config.botName }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    const botName = args.join(" ").trim();
    if (!botName) {
      await misa.sendMessage(from, { text: t("commands.nomebot.invalid") }, { quoted: message as WAMessage });
      return;
    }

    config.botName = botName;
    await saveBotConfig(config);

    await misa.sendMessage(
      from,
      { text: t("commands.nomebot.updated", { value: botName }) },
      { quoted: message as WAMessage },
    );
  },
};

export default nomebotCommand;
