/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";
import { sendMenu } from "../../../helpers/sendMenu.js";

const menuFigCommand: Command = {
  name: "menufig",
  aliases: ["mfig", "menusticker", "figmenu"],
  description: "Mostra os comandos de figurinha",
  category: "geral",
  async execute({ misa, message, from, prefix, t }) {
    const config = await getBotConfig();

    await sendMenu(
      misa,
      from,
      [
        t("commands.menu.mainTitle", { botName: config.botName }),
        "│",
        `├ 〔 ${t("commands.menu.categories.fig")} 〕`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.sticker")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.sticker2")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.brat")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.brat2")}`,
        "│",
        "‧₊˚ ────────────────˚₊‧",
      ].join("\n"),
      message as WAMessage,
    );
  },
};

export default menuFigCommand;
