import { WAMessage } from "baileys";
import { getGroup, saveGroup } from "../../../database/groupDB.js";
import { Command } from "../../../types/Command.js";

const antidocCommand: Command = {
  name: "antidoc",
  aliases: ["antidocumento", "antidocument"],
  i18nAliases: {
    en: ["antidoc", "antidocument"],
    es: ["antidoc", "antidocumento"],
    id: ["antidoc", "antidokumen"],
  },
  description: "Ativa ou desativa o bloqueio de documentos",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, t }) {
    const config = await getGroup(from);
    const next = !config.antimidia.doc;
    await saveGroup(from, { antimidia: { ...config.antimidia, doc: next } });
    await misa.sendMessage(from, { text: next ? t("commands.antidoc.enabled") : t("commands.antidoc.disabled") }, { quoted: message as WAMessage });
  },
};

export default antidocCommand;
