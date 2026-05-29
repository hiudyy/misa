import process from "node:process";
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const restartCommand: Command = {
  name: "restart",
  aliases: ["reiniciar", "rebootbot"],
  description: "Reinicia o processo do bot",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, t }) {
    await misa.sendMessage(from, { text: t("commands.restart.restarting") }, { quoted: message as WAMessage });
    setTimeout(() => process.exit(0), 300);
  },
};

export default restartCommand;
