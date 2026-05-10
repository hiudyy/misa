/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";
import { sendMenu } from "../../../helpers/sendMenu.js";

const menuAdmCommand: Command = {
  name: "menuadm",
  aliases: ["madm", "menuadmin"],
  description: "Mostra os comandos de administração",
  category: "geral",
  groupOnly: true,
  adminOnly: true,
  async execute({ misa, message, from, prefix }) {
    const config = await getBotConfig();

    await sendMenu(
      misa,
      from,
      [
        `‧₊˚ ✿ ── ${config.botName} ──✿ ˚₊‧`,
        "│",
        "├ 〔 grupo 〕",
        `│  ♡ ${prefix}gp`,
        `│  ♡ ${prefix}kick`,
        `│  ♡ ${prefix}promote`,
        `│  ♡ ${prefix}demote`,
        `│  ♡ ${prefix}nomegp`,
        `│  ♡ ${prefix}descgp`,
        "│",
        "├ 〔 ativações 〕",
        `│  ♡ ${prefix}antilink`,
        `│  ♡ ${prefix}antilinkgp`,
        `│  ♡ ${prefix}antilinkch`,
        `│  ♡ ${prefix}bemvindo`,
        "│",
        "├ 〔 bem-vindo 〕",
        `│  ♡ ${prefix}legendabv`,
        `│  ♡ ${prefix}midiabv`,
        "│",
        "‧₊˚ ────────────────˚₊‧",
      ].join("\n"),
      message as WAMessage,
    );
  },
};

export default menuAdmCommand;
