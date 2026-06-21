/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig, saveBotConfig } from "../../../config.js";
import { getLocalizedCommandWordVars, resolveLocalizedToken } from "../../../helpers/localizedTokens.js";
import { Command } from "../../../types/Command.js";

const autoupdateCommand: Command = {
  name: "autoupdate",
  aliases: ["setautoupdate", "atualizacaoauto"],
  description: "Ativa ou desativa o auto update do bot",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, t, locale }) {
    const config = await getBotConfig();
    const words = getLocalizedCommandWordVars(locale);

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.autoupdate.current", { ...words, value: config.autoUpdate ? t("common.enabled") : t("common.disabled") }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    const value = resolveLocalizedToken(locale, args[0], ["on", "off"]);
    if (value !== "on" && value !== "off") {
      await misa.sendMessage(from, { text: t("commands.autoupdate.invalid", words) }, { quoted: message as WAMessage });
      return;
    }

    config.autoUpdate = value === "on";
    await saveBotConfig(config);

    await misa.sendMessage(
      from,
      { text: t("commands.autoupdate.updated", { value: config.autoUpdate ? t("common.enabled") : t("common.disabled") }) },
      { quoted: message as WAMessage },
    );
  },
};

export default autoupdateCommand;
