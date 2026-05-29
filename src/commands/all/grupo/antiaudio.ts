/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getGroup, saveGroup } from "../../../database/groupDB.js";
import { Command } from "../../../types/Command.js";

const antiaudioCommand: Command = {
  name: "antiaudio",
  aliases: ["antiaud"],
  i18nAliases: {
    en: ["antiaudio"],
    es: ["antiaudio"],
    id: ["antiaudio"],
  },
  description: "Ativa ou desativa o bloqueio de áudio",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, t }) {
    const config = await getGroup(from);
    const next = !config.antimidia.audio;
    await saveGroup(from, { antimidia: { ...config.antimidia, audio: next } });
    await misa.sendMessage(from, { text: next ? t("commands.antiaudio.enabled") : t("commands.antiaudio.disabled") }, { quoted: message as WAMessage });
  },
};

export default antiaudioCommand;