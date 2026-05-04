/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";

const menuDlCommand: Command = {
  name: "menudl",
  aliases: ["menudownloads", "mdownloads"],
  description: "Mostra os comandos de downloads",
  category: "geral",
  async execute({ misa, message, from, prefix }) {
    const config = await getBotConfig();

    await misa.sendMessage(
      from,
      {
        text: [
          `‧₊˚ ✿ ── ${config.botName} ──✿ ˚₊‧`,
          "│",
          "├ 〔 downloads 〕",
          `│  ♡ ${prefix}tiktok`,
          `│  ♡ ${prefix}instagram`,
          `│  ♡ ${prefix}pinterest`,
          "│",
          "‧₊˚ ────────────────˚₊‧",
        ].join("\n"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default menuDlCommand;
