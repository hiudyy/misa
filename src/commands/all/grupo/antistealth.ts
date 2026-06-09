/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getGroup, saveGroup } from "../../../database/groupDB.js";
import { Command } from "../../../types/Command.js";

const antistealthCommand: Command = {
  name: "antistealth",
  aliases: ["antifurtivo", "antisombra"],
  description: "Remove usuários que disparam mensagens não descriptografadas em rajada",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, t }) {
    const config = await getGroup(from);
    const next = !config.antistealth;
    await saveGroup(from, { antistealth: next });
    await misa.sendMessage(from, { text: next ? t("commands.antistealth.enabled") : t("commands.antistealth.disabled") }, { quoted: message as WAMessage });
  },
};

export default antistealthCommand;
