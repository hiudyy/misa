/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getOwnerConfig, saveOwnerConfig } from "../../../ownerConfig.js";
import { Command } from "../../../types/Command.js";

const antipvCommand: Command = {
  name: "antipv",
  aliases: ["antiprivado", "privateoff"],
  i18nAliases: {
    en: ["antiprivate", "privateoff"],
    es: ["antiprivado"],
    id: ["antipribadi"],
  },
  description: "Ativa ou desativa o bot no privado para não-donos",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, t }) {
    const config = await getOwnerConfig();
    const next = !config.antiPrivate;
    await saveOwnerConfig({ ...config, antiPrivate: next });
    await misa.sendMessage(from, { text: next ? t("commands.antipv.enabled") : t("commands.antipv.disabled") }, { quoted: message as WAMessage });
  },
};

export default antipvCommand;