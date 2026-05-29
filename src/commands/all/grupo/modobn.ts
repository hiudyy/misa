/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getGroup, saveGroup } from "../../../database/groupDB.js";
import { Command } from "../../../types/Command.js";

const modobnCommand: Command = {
  name: "modobn",
  aliases: ["modobrincadeira", "brincadeira"],
  i18nAliases: {
    en: ["funmode", "playmode"],
    es: ["mododiversion", "modobroma"],
    id: ["modeseru", "modocanda"],
  },
  description: "Ativa ou desativa o modo brincadeira no grupo",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  async execute({ misa, message, from, t }) {
    const config = await getGroup(from);
    const next = !config.modobn;
    await saveGroup(from, { modobn: next });

    await misa.sendMessage(
      from,
      { text: next ? t("commands.modobn.enabled") : t("commands.modobn.disabled") },
      { quoted: message as WAMessage },
    );
  },
};

export default modobnCommand;