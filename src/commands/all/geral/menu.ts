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
  async execute({ misa, message, from, prefix, t }) {
    const config = await getBotConfig();

    await sendMenu(
      misa,
      from,
      [
        t("commands.menu.mainTitle", { botName: config.botName }),
        "│",
        `│  ♡ ${prefix}${t("commands.menu.cmds.menugeral")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.menufig")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.menudl")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.menugrupo")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.menuadm")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.menudono")}`,
        "│",
        "‧₊˚ ────────────────˚₊‧",
      ].join("\n"),
      message as WAMessage,
    );
  },
};

export default menuCommand;
