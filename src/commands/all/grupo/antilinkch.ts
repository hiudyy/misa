/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { AntiLinkPunicao, getGroup, saveGroup } from "../../../database/groupDB.js";
import { Command } from "../../../types/Command.js";

const PARAMS = [
  "@usuario   → menciona o usuário",
  "@nome      → nome do usuário",
  "@grupo     → nome do grupo",
  "@tipo      → tipo do link detectado",
].join("\n│ ");

const antilinkchCommand: Command = {
  name: "antilinkch",
  aliases: ["antilinkcanal", "alch"],
  description: "Ativa ou configura o anti-link de canal",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args }) {
    const config = await getGroup(from);

    if (args.length === 0) {
      const novoEstado = !config.antilinkch.ativo;
      await saveGroup(from, { antilinkch: { ...config.antilinkch, ativo: novoEstado } });
      await misa.sendMessage(
        from,
        {
          text: [
            novoEstado ? "✅ Anti-link de canal *ativado* neste grupo!" : "❌ Anti-link de canal *desativado* neste grupo.",
            "",
            "⚙️ Configurações:",
            "• antilinkch punicao apagar",
            "• antilinkch punicao banir",
            "• antilinkch texto <mensagem>",
          ].join("\n"),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const action = args[0].toLowerCase();

    if (action === "punicao") {
      const punicao = args[1]?.toLowerCase() as AntiLinkPunicao | undefined;
      if (punicao !== "apagar" && punicao !== "banir") {
        await misa.sendMessage(
          from,
          { text: "❌ Use: antilinkch punicao apagar | banir" },
          { quoted: message as WAMessage },
        );
        return;
      }

      await saveGroup(from, { antilinkch: { ...config.antilinkch, punicao } });
      await misa.sendMessage(
        from,
        { text: `✅ Punição do anti-link de canal atualizada para *${punicao}*.` },
        { quoted: message as WAMessage },
      );
      return;
    }

    if (action === "texto") {
      if (args.length === 1) {
        await misa.sendMessage(
          from,
          {
            text: [
              "╭─「 *TEXTO ANTILINK CH* 」",
              "│",
              "│ *Parâmetros disponíveis:*",
              `│ ${PARAMS}`,
              "│",
              "│ *Texto atual:*",
              `│ ${config.antilinkch.texto}`,
              "│",
              "╰─ Use: antilinkch texto <mensagem>",
            ].join("\n"),
          },
          { quoted: message as WAMessage },
        );
        return;
      }

      const texto = args.slice(1).join(" ");
      await saveGroup(from, { antilinkch: { ...config.antilinkch, texto } });
      await misa.sendMessage(
        from,
        { text: `✅ Texto do anti-link de canal atualizado!\n\n${texto}` },
        { quoted: message as WAMessage },
      );
      return;
    }

    await misa.sendMessage(
      from,
      {
        text: [
          "╭─「 *ANTILINK CH* 」",
          "│",
          "│ antilinkch",
          "│ antilinkch punicao apagar",
          "│ antilinkch punicao banir",
          "│ antilinkch texto <mensagem>",
        ].join("\n"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default antilinkchCommand;
