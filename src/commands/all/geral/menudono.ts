/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";

const menuDonoCommand: Command = {
  name: "menudono",
  aliases: ["mdono"],
  description: "Mostra os comandos do dono",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, prefix }) {
    const config = await getBotConfig();

    await misa.sendMessage(
      from,
      {
        text: [
          `‧₊˚ ✿ ── ${config.botName} ──✿ ˚₊‧`,
          "│",
          "├ 〔 dono 〕",
          `│  ♡ ${prefix}eval`,
          "│",
          "‧₊˚ ────────────────˚₊‧",
        ].join("\n"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default menuDonoCommand;
