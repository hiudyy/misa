/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig, saveBotConfig } from "../../../config.js";
import { getLocalizedCommandWordVars, matchesLocalizedToken } from "../../../helpers/localizedTokens.js";
import { Command } from "../../../types/Command.js";

const apikeyCommand: Command = {
  name: "apikey",
  aliases: ["setapikey", "keyapi"],
  description: "Atualiza a API key usada pelo bot",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, t, locale }) {
    const config = await getBotConfig();
    const words = getLocalizedCommandWordVars(locale);

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.apikey.current", { ...words, value: config.apiKey ? t("common.yes") : t("common.no") }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    const value = args.join(" ").trim();

    if (matchesLocalizedToken(locale, value, "off") || matchesLocalizedToken(locale, value, "reset")) {
      config.apiKey = "";
      await saveBotConfig(config);
      await misa.sendMessage(from, { text: t("commands.apikey.cleared") }, { quoted: message as WAMessage });
      return;
    }

    config.apiKey = value;
    await saveBotConfig(config);

    await misa.sendMessage(from, { text: t("commands.apikey.updated") }, { quoted: message as WAMessage });
  },
};

export default apikeyCommand;
