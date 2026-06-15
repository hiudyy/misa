/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig } from "../../../config.js";
import { Command } from "../../../types/Command.js";

const donoCommand: Command = {
  name: "dono",
  aliases: ["owner", "infodono", "ownerinfo"],
  description: "Mostra as informacoes do dono do bot",
  category: "geral",
  async execute({ misa, message, from, t }) {
    const config = await getBotConfig();

    await misa.sendMessage(
      from,
      {
        text: t("commands.dono.text", {
          owner: config.ownerName,
          ownerNumber: config.ownerNumber || t("common.none"),
          bot: config.botName,
        }),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default donoCommand;
