/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";

const menuGeralCommand: Command = {
  name: "menugeral",
  aliases: ["mgeral"],
  description: "Mostra os comandos gerais",
  category: "geral",
  async execute({ misa, message, from, prefix }) {
    const config = await getBotConfig();

    await misa.sendMessage(
      from,
      {
        text: [
          `‧₊˚ ✿ ── ${config.botName} ──✿ ˚₊‧`,
          "│",
          "├ 〔 geral 〕",
          `│  ♡ ${prefix}ping`,
          "│",
          "‧₊˚ ────────────────˚₊‧",
        ].join("\n"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default menuGeralCommand;
