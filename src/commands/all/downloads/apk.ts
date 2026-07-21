/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { setApkSession } from "../../../helpers/apkSession.js";
import { searchModyolo } from "../../../helpers/modyoloDownload.js";

const apkCommand: Command = {
  name: "apk",
  aliases: ["modyolo", "modapk", "apkmod", "mod"],
  i18nAliases: {
    pt: ["apkmod", "modapk", "aplicativomod"],
    en: ["apkmod", "modapk", "moddedapk"],
    es: ["apkmod", "modapk", "aplicacionmod"],
    id: ["apkmod", "modapk", "aplikasimod"],
    ar: ["apkmod", "modapk"],
    fr: ["apkmod", "modapk", "applimod"],
    hi: ["apkmod", "modapk"],
    ur: ["apkmod", "modapk"],
    de: ["apkmod", "modapk", "modapp"],
    tr: ["apkmod", "modapk"],
    bn: ["apkmod", "modapk"],
  },
  description: "Downloads a modified APK from Modyolo",
  category: "all",
  async execute({ misa, message, from, sender, args, rawArgs, prefix, t }) {
    const query = rawArgs.trim();

    if (!query) {
      await misa.sendMessage(
        from,
        { text: t("commands.apk.usage", { prefix }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    await misa.sendMessage(from, { text: t("commands.apk.searching") }, { quoted: message as WAMessage });

    try {
      const results = await searchModyolo(query);

      if (results.length === 0) {
        await misa.sendMessage(
          from,
          { text: t("commands.apk.noResults", { query }) },
          { quoted: message as WAMessage },
        );
        return;
      }

      let msg = t("commands.apk.select", { query }) + "\n\n";
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const modInfo = r.modInfo ? ` *[${r.modInfo}]*` : "";
        msg += `*${i + 1}.* ${r.name} (${r.version}) - ${r.size}${modInfo}\n`;
      }
      msg += `\n${t("commands.apk.selectApp")}`;

      await misa.sendMessage(from, { text: msg }, { quoted: message as WAMessage });

      setApkSession({
        from,
        sender,
        step: "select_app",
        results,
        createdAt: Date.now(),
      });
    } catch {
      await misa.sendMessage(from, { text: t("commands.apk.error") }, { quoted: message as WAMessage });
    }
  },
};

export default apkCommand;
