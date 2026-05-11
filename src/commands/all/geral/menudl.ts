/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";
import { sendMenu } from "../../../helpers/sendMenu.js";

const menuDlCommand: Command = {
  name: "menudl",
  aliases: ["menudownloads", "mdownloads", "dlmenu", "menudescargas"],
  description: "Mostra os comandos de downloads",
  category: "geral",
  async execute({ misa, message, from, prefix, t }) {
    const config = await getBotConfig();

    await sendMenu(
      misa,
      from,
      [
        t("commands.menu.mainTitle", { botName: config.botName }),
        "│",
        `├ 〔 ${t("commands.menu.categories.downloads")} 〕`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.play")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.tiktok")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.instagram")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.pinterest")}`,
        "│",
        "‧₊˚ ────────────────˚₊‧",
      ].join("\n"),
      message as WAMessage,
    );
  },
};

export default menuDlCommand;
