import { WAMessage } from "baileys";
import { getGroup, saveGroup } from "../../../database/groupDB.js";
import { Command } from "../../../types/Command.js";

const antilocCommand: Command = {
  name: "antiloc",
  aliases: ["antilocalizacao", "antilocation"],
  i18nAliases: {
    en: ["antilocation"],
    es: ["antiubicacion"],
    id: ["antilokasi"],
  },
  description: "Ativa ou desativa o bloqueio de localização",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, t }) {
    const config = await getGroup(from);
    const next = !config.antimidia.loc;
    await saveGroup(from, { antimidia: { ...config.antimidia, loc: next } });
    await misa.sendMessage(from, { text: next ? t("commands.antiloc.enabled") : t("commands.antiloc.disabled") }, { quoted: message as WAMessage });
  },
};

export default antilocCommand;
