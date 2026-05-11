/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";
import { sendMenu } from "../../../helpers/sendMenu.js";

const menuDonoCommand: Command = {
  name: "menudono",
  aliases: ["mdono", "ownermenu", "menudueño"],
  description: "Mostra os comandos do dono",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, prefix, t }) {
    const config = await getBotConfig();

    await sendMenu(
      misa,
      from,
      [
        t("commands.menu.mainTitle", { botName: config.botName }),
        "│",
        `├ 〔 ${t("commands.menu.categories.owner")} 〕`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.eval")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.cmdnf")}`,
        "│",
        "‧₊˚ ────────────────˚₊‧",
      ].join("\n"),
      message as WAMessage,
    );
  },
};

export default menuDonoCommand;
