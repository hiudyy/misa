import { WAMessage } from "baileys";
import { getGroup, saveGroup } from "../../../database/groupDB.js";
import { Command } from "../../../types/Command.js";

const soadminCommand: Command = {
  name: "soadmin",
  aliases: ["somenteadmin", "adminonlygp"],
  description: "Permite que apenas admins usem comandos no grupo",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  async execute({ misa, message, from, t }) {
    const config = await getGroup(from);
    const next = !config.soadmin;
    await saveGroup(from, { soadmin: next });

    await misa.sendMessage(
      from,
      { text: next ? t("commands.soadmin.enabled") : t("commands.soadmin.disabled") },
      { quoted: message as WAMessage },
    );
  },
};

export default soadminCommand;
