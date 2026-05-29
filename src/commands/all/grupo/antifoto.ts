/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getGroup, saveGroup } from "../../../database/groupDB.js";
import { Command } from "../../../types/Command.js";

const antifotoCommand: Command = {
  name: "antifoto",
  aliases: ["antiimg", "antiimagem"],
  i18nAliases: {
    en: ["antiimage", "antiphoto"],
    es: ["antifoto"],
    id: ["antifoto"],
  },
  description: "Ativa ou desativa o bloqueio de fotos",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, t }) {
    const config = await getGroup(from);
    const next = !config.antimidia.foto;
    await saveGroup(from, { antimidia: { ...config.antimidia, foto: next } });
    await misa.sendMessage(from, { text: next ? t("commands.antifoto.enabled") : t("commands.antifoto.disabled") }, { quoted: message as WAMessage });
  },
};

export default antifotoCommand;