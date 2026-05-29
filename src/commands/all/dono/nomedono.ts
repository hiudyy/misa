/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig, saveBotConfig } from "../../../config.js";
import { Command } from "../../../types/Command.js";

const nomedonoCommand: Command = {
  name: "nomedono",
  aliases: ["ownername", "setownername"],
  description: "Atualiza o nome do dono no config do bot",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, t }) {
    const config = await getBotConfig();

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.nomedono.current", { value: config.ownerName }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    const ownerName = args.join(" ").trim();
    if (!ownerName) {
      await misa.sendMessage(from, { text: t("commands.nomedono.invalid") }, { quoted: message as WAMessage });
      return;
    }

    config.ownerName = ownerName;
    await saveBotConfig(config);

    await misa.sendMessage(
      from,
      { text: t("commands.nomedono.updated", { value: ownerName }) },
      { quoted: message as WAMessage },
    );
  },
};

export default nomedonoCommand;
