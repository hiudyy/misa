/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";

const menuCommand: Command = {
  name: "menu",
  aliases: ["help", "ajuda", "comandos"],
  description: "Mostra o menu de comandos no privado",
  category: "all",
  privateOnly: true,
  async execute({ misa, message, from, prefix }) {
    const config = await getBotConfig();

    await misa.sendMessage(
      from,
      {
        text: [
          `╭─「 *${config.botName.toUpperCase()}* 」`,
          "│",
          "├─「 *COMANDOS GERAIS* 」",
          `│ ✦ ${prefix}ping - Verifica latência`,
          `│ ✦ ${prefix}menu - Mostra este menu`,
          "│",
          "├─「 *DOWNLOADS* 」",
          `│ ✦ ${prefix}tiktok <url/termo> - TikTok`,
          `│ ✦ ${prefix}instagram <url> - Instagram`,
          `│ ✦ ${prefix}pinterest <url/termo> - Pinterest`,
          "│",
          "├─「 *COMANDOS DE GRUPO* 」",
          `│ ✦ ${prefix}groupinfo - Info do grupo`,
          `│ ✦ ${prefix}kick @user - Remove membro`,
          `│ ✦ ${prefix}promote @user - Promove admin`,
          `│ ✦ ${prefix}demote @user - Rebaixa admin`,
          "│",
          "├─「 *COMANDOS DO DONO* 」",
          `│ ✦ ${prefix}owner - Info do dono`,
          `│ ✦ ${prefix}eval <code> - Executa código`,
          "│",
          `╰─ Use ${prefix}menu no privado para ver todos os comandos.`,
        ].join("\n"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default menuCommand;
