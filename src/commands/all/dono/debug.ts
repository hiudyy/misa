/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { setMessageDebugEnabled, toggleMessageDebug } from "../../../helpers/messageDebug.js";
import { Command } from "../../../types/Command.js";

const debugCommand: Command = {
  name: "debug",
  aliases: ["debugmsg", "debugmessages"],
  description: "Liga ou desliga logs completos dos eventos de mensagem",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, t }) {
    const option = args[0]?.toLowerCase();
    const enabled = option === "on" || option === "ligar" || option === "ativar"
      ? setMessageDebugEnabled(true)
      : option === "off" || option === "desligar" || option === "desativar"
        ? setMessageDebugEnabled(false)
        : toggleMessageDebug();

    await misa.sendMessage(
      from,
      { text: enabled ? t("commands.debug.enabled") : t("commands.debug.disabled") },
      { quoted: message as WAMessage },
    );
  },
};

export default debugCommand;
