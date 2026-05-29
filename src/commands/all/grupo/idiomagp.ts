/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";
import { getGroup, saveGroup } from "../../../database/groupDB.js";
import { createTranslator } from "../../../i18n/index.js";

const idiomagpCommand: Command = {
  name: "idiomagp",
  aliases: ["idiomagrupo", "idiomgp", "lenguajegrupo", "langgroup", "languagegroup", "setlanggroup", "languegroupe", "setlanguegroupe", "bhashagroup", "setbhashagroup", "zabangroup", "setzabangroup"],
  description: "Muda o idioma do grupo",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  async execute({ misa, message, from, args, t }) {
    const groupConfig = await getGroup(from);
    const globalConfig = await getBotConfig();

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.idiomagp.current", { 
            language: groupConfig.language || globalConfig.language,
            global: globalConfig.language 
          }) 
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const newLang = args[0].toLowerCase();
    
    if (newLang === "reset") {
      await saveGroup(from, { language: undefined });
      await misa.sendMessage(
        from,
        { text: t("commands.idiomagp.reset", { language: globalConfig.language }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    if (newLang !== "pt" && newLang !== "es" && newLang !== "en" && newLang !== "id" && newLang !== "ar" && newLang !== "fr" && newLang !== "hi" && newLang !== "ur") {
      await misa.sendMessage(
        from,
        { text: t("commands.idiomagp.invalid") },
        { quoted: message as WAMessage },
      );
      return;
    }

    await saveGroup(from, { language: newLang as "pt" | "es" | "en" | "id" | "ar" | "fr" | "hi" | "ur" });

    await misa.sendMessage(
      from,
      // Create translator for the new language
      { text: createTranslator(newLang as "pt" | "es" | "en" | "id" | "ar" | "fr" | "hi" | "ur")("commands.idiomagp.updated", { language: newLang }) },
      { quoted: message as WAMessage },
    );
  },
};

export default idiomagpCommand;
