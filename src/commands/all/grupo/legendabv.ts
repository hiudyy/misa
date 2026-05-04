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
  aliases: ["legendabemvindo", "textobv"],
  description: "Configura o texto da mensagem de bem-vindo",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args }) {
    if (args.length === 0) {
      const config = await getGroup(from);
      await misa.sendMessage(
        from,
        {
          text: [
            "╭─「 *LEGENDA BV* 」",
            "│",
            "│ *Parâmetros disponíveis:*",
            `│ ${PARAMS}`,
            "│",
            `│ *Legenda atual:*`,
            `│ ${config.bemvindo.legenda}`,
            "│",
            "╰─ Use: legendabv <texto>",
          ].join("\n"),
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
      { text: `✅ Legenda de bem-vindo atualizada!\n\n${legenda}` },
      { quoted: message as WAMessage },
    );
  },
};

export default legendabvCommand;
