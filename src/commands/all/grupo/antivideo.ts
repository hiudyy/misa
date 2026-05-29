/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getGroup, saveGroup } from "../../../database/groupDB.js";
import { Command } from "../../../types/Command.js";

const antivideoCommand: Command = {
  name: "antivideo",
  aliases: ["antivid", "antivd"],
  i18nAliases: {
    en: ["antivideo"],
    es: ["antivideo"],
    id: ["antivideo"],
  },
  description: "Ativa ou desativa o bloqueio de vídeos",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, t }) {
    const config = await getGroup(from);
    const next = !config.antimidia.video;
    await saveGroup(from, { antimidia: { ...config.antimidia, video: next } });
    await misa.sendMessage(from, { text: next ? t("commands.antivideo.enabled") : t("commands.antivideo.disabled") }, { quoted: message as WAMessage });
  },
};

export default antivideoCommand;