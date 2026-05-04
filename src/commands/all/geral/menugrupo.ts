/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";

const menuGrupoCommand: Command = {
  name: "menugrupo",
  aliases: ["mgrupo"],
  description: "Mostra os comandos disponíveis no grupo",
  category: "geral",
  groupOnly: true,
  async execute({ misa, message, from, prefix }) {
    const config = await getBotConfig();

    await misa.sendMessage(
      from,
      {
        text: [
          `‧₊˚ ✿ ── ${config.botName} ──✿ ˚₊‧`,
          "│",
          "├ 〔 grupo 〕",
          `│  ♡ ${prefix}admins`,
          "│",
          "‧₊˚ ────────────────˚₊‧",
        ].join("\n"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default menuGrupoCommand;
