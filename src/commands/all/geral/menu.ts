/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";
import { sendMenu } from "../../../helpers/sendMenu.js";

const menuCommand: Command = {
  name: "menu",
  aliases: ["help", "ajuda", "comandos"],
  description: "Mostra o menu principal",
  category: "geral",
  async execute({ misa, message, from, prefix }) {
    const config = await getBotConfig();

    await sendMenu(
      misa,
      from,
      [
        `‧₊˚ ✿ ── ${config.botName} ──✿ ˚₊‧`,
        "│",
        `│  ♡ ${prefix}menugeral`,
        `│  ♡ ${prefix}menudl`,
        `│  ♡ ${prefix}menugrupo`,
        `│  ♡ ${prefix}menuadm`,
        `│  ♡ ${prefix}menudono`,
        "│",
        "‧₊˚ ────────────────˚₊‧",
      ].join("\n"),
      message as WAMessage,
    );
  },
};

export default menuCommand;
