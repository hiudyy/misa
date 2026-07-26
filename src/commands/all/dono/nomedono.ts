/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig, updateBotConfig } from "../../../config.js";
import { Command } from "../../../types/Command.js";

const nomedonoCommand: Command = {
  name: "nomedono",
  aliases: ["ownername", "setownername"],
  description: "Updates the owner name in the bot config",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, rawArgs, t }) {
    const config = await getBotConfig();

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.nomedono.current", { value: config.ownerName }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    const ownerName = rawArgs.trim();
    if (!ownerName) {
      await misa.sendMessage(from, { text: t("commands.nomedono.invalid") }, { quoted: message as WAMessage });
      return;
    }

    await updateBotConfig((current) => ({ ...current, ownerName }));

    await misa.sendMessage(
      from,
      { text: t("commands.nomedono.updated", { value: ownerName }) },
      { quoted: message as WAMessage },
    );
  },
};

export default nomedonoCommand;
