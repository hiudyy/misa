/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getGroup, saveGroup } from "../../../database/groupDB.js";

const PARAMS = [
  "@usuario   → menciona o usuário",
  "@nome      → nome do usuário",
  "@grupo     → nome do grupo",
  "@total     → total de membros",
  "@desc      → descrição do grupo",
].join("\n│ ");

const legendabvCommand: Command = {
  name: "legendabv",
  aliases: ["legendabemvindo", "textobv", "welcometext"],
  description: "Configura o texto da mensagem de bem-vindo",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args, t }) {
    if (args.length === 0) {
      const config = await getGroup(from);
      await misa.sendMessage(
        from,
        {
          text: t("commands.legendabv.header", {
            params: t("commands.legendabv.params"),
            current: config.bemvindo.legenda,
          }),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const legenda = args.join(" ");
    const current = await getGroup(from);
    await saveGroup(from, { bemvindo: { ...current.bemvindo, legenda } });

    await misa.sendMessage(
      from,
      { text: t("commands.legendabv.updated", { text: legenda }) },
      { quoted: message as WAMessage },
    );
  },
};

export default legendabvCommand;
