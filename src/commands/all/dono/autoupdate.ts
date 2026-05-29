/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig, saveBotConfig } from "../../../config.js";
import { Command } from "../../../types/Command.js";

const autoupdateCommand: Command = {
  name: "autoupdate",
  aliases: ["setautoupdate", "atualizacaoauto"],
  description: "Ativa ou desativa o auto update do bot",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, t }) {
    const config = await getBotConfig();

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.autoupdate.current", { value: config.autoUpdate ? t("common.enabled") : t("common.disabled") }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    const value = args[0]?.toLowerCase();
    if (value !== "on" && value !== "off") {
      await misa.sendMessage(from, { text: t("commands.autoupdate.invalid") }, { quoted: message as WAMessage });
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
