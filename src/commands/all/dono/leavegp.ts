import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const leavegpCommand: Command = {
  name: "leavegp",
  aliases: ["sairgp", "leavegroup"],
  description: "Faz o bot sair do grupo atual",
  category: "geral",
  ownerOnly: true,
  groupOnly: true,
  async execute({ misa, message, from, t }) {
    await misa.sendMessage(from, { text: t("commands.leavegp.confirm") }, { quoted: message as WAMessage });
    await misa.groupLeave(from);
  },
};

export default leavegpCommand;
