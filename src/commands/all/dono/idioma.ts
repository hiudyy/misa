/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig, saveBotConfig } from "../../../config.js";
import { createTranslator } from "../../../i18n/index.js";

const idiomaCommand: Command = {
  name: "idioma",
  aliases: ["setidioma", "lenguaje", "setlenguaje", "language", "setlanguage", "lang", "setlang"],
  description: "Muda o idioma global do bot",
  category: "all",
  ownerOnly: true,
  async execute({ misa, message, from, args, t }) {
    const config = await getBotConfig();

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.idioma.current", { language: config.language }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    const newLang = args[0].toLowerCase();
    
    if (newLang !== "pt" && newLang !== "es" && newLang !== "en") {
      await misa.sendMessage(
        from,
        { text: t("commands.idioma.invalid") },
        { quoted: message as WAMessage },
      );
      return;
    }

    config.language = newLang as "pt" | "es" | "en";
    await saveBotConfig(config);

    // Update global translator if needed (though t is injected contextually, 
    // the next command will use the new language automatically)

    await misa.sendMessage(
      from,
      // We manually create a translator for the new language to reply in the new language
      { text: createTranslator(newLang as "pt" | "es" | "en")("commands.idioma.updated", { language: newLang }) },
      { quoted: message as WAMessage },
    );
  },
};

export default idiomaCommand;
