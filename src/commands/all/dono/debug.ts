/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { resolveLocalizedToken } from "../../../helpers/localizedTokens.js";
import { setMessageDebugEnabled, toggleMessageDebug } from "../../../helpers/messageDebug.js";
import { Command } from "../../../types/Command.js";

const debugCommand: Command = {
  name: "debug",
  aliases: ["debugmsg", "debugmessages"],
  description: "Liga ou desliga logs completos dos eventos de mensagem",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, t, locale }) {
    const option = resolveLocalizedToken(locale, args[0], ["on", "off"]);
    const enabled = option === "on"
      ? setMessageDebugEnabled(true)
      : option === "off"
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
