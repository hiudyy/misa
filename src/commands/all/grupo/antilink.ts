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

const antilinkCommand: Command = {
  name: "antilink",
  aliases: ["al"],
  description: "Ativa ou configura o anti-link geral",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args }) {
    const config = await getGroup(from);

    if (args.length === 0) {
      const novoEstado = !config.antilink.ativo;
      await saveGroup(from, { antilink: { ...config.antilink, ativo: novoEstado } });
      await misa.sendMessage(
        from,
        {
          text: [
            novoEstado ? "✅ Anti-link *ativado* neste grupo!" : "❌ Anti-link *desativado* neste grupo.",
            "",
            "⚙️ Configurações:",
            "• antilink punicao apagar",
            "• antilink punicao banir",
            "• antilink texto <mensagem>",
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
          { text: "❌ Use: antilink punicao apagar | banir" },
          { quoted: message as WAMessage },
        );
        return;
      }

      await saveGroup(from, { antilink: { ...config.antilink, punicao } });
      await misa.sendMessage(
        from,
        { text: `✅ Punição do anti-link atualizada para *${punicao}*.` },
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
              "╭─「 *TEXTO ANTILINK* 」",
              "│",
              "│ *Parâmetros disponíveis:*",
              `│ ${PARAMS}`,
              "│",
              "│ *Texto atual:*",
              `│ ${config.antilink.texto}`,
              "│",
              "╰─ Use: antilink texto <mensagem>",
            ].join("\n"),
          },
          { quoted: message as WAMessage },
        );
        return;
      }

      const texto = args.slice(1).join(" ");
      await saveGroup(from, { antilink: { ...config.antilink, texto } });
      await misa.sendMessage(
        from,
        { text: `✅ Texto do anti-link atualizado!\n\n${texto}` },
        { quoted: message as WAMessage },
      );
      return;
    }

    await misa.sendMessage(
      from,
      {
        text: [
          "╭─「 *ANTILINK* 」",
          "│",
          "│ antilink",
          "│ antilink punicao apagar",
          "│ antilink punicao banir",
          "│ antilink texto <mensagem>",
        ].join("\n"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default antilinkCommand;
