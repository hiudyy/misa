/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig, saveBotConfig } from "../../../config.js";
import { Command } from "../../../types/Command.js";

const prefixoCommand: Command = {
  name: "prefixo",
  aliases: ["prefix", "setprefix"],
  description: "Atualiza o prefixo do bot",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, t }) {
    const config = await getBotConfig();

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.prefixo.current", { value: config.prefix }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    const prefix = args[0]?.trim() || "";
    if (!prefix || prefix.length > 5 || /\s/.test(prefix)) {
      await misa.sendMessage(from, { text: t("commands.prefixo.invalid") }, { quoted: message as WAMessage });
      return;
    }

    config.prefix = prefix;
    await saveBotConfig(config);

    await misa.sendMessage(
      from,
      { text: t("commands.prefixo.updated", { value: prefix }) },
      { quoted: message as WAMessage },
    );
  },
};

export default prefixoCommand;
