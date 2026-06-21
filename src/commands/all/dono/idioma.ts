/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig, saveBotConfig } from "../../../config.js";
import {
  createTranslator,
  getGlobalLanguageAliases,
  getLocaleCommandOptions,
  getLocaleDisplayList,
  getLocaleLabel,
  isValidLocale,
} from "../../../i18n/index.js";
import { getLocalizedCommandWordVars } from "../../../helpers/localizedTokens.js";

const idiomaCommand: Command = {
  name: "idioma",
  aliases: ["setidioma"],
  i18nAliases: getGlobalLanguageAliases(),
  description: "Muda o idioma global do bot",
  category: "all",
  ownerOnly: true,
  async execute({ misa, message, from, args, t, locale }) {
    const config = await getBotConfig();
    const words = getLocalizedCommandWordVars(locale);

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.idioma.current", { ...words, language: getLocaleLabel(config.language), options: getLocaleCommandOptions() }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    const newLang = args[0].toLowerCase();

    if (!isValidLocale(newLang)) {
      await misa.sendMessage(
        from,
        { text: t("commands.idioma.invalid", { ...words, optionsList: getLocaleDisplayList(), options: getLocaleCommandOptions() }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    config.language = newLang;
    await saveBotConfig(config);

    await misa.sendMessage(
      from,
      { text: createTranslator(newLang)("commands.idioma.updated", { language: getLocaleLabel(newLang) }) },
      { quoted: message as WAMessage },
    );
  },
};

export default idiomaCommand;
