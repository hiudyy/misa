/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";
import { sendMenu } from "../../../helpers/sendMenu.js";

const menuGeralCommand: Command = {
  name: "menugeral",
  aliases: ["mgeral"],
  description: "Mostra os comandos gerais",
  category: "geral",
  async execute({ misa, message, from, prefix }) {
    const config = await getBotConfig();

    await sendMenu(
      misa,
      from,
      [
        `‧₊˚ ✿ ── ${config.botName} ──✿ ˚₊‧`,
        "│",
        "├ 〔 geral 〕",
        `│  ♡ ${prefix}ping`,
        "│",
        "‧₊˚ ────────────────˚₊‧",
      ].join("\n"),
      message as WAMessage,
    );
  },
};

export default menuGeralCommand;
