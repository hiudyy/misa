/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getOwnerConfig, saveOwnerConfig } from "../../../ownerConfig.js";
import { Command } from "../../../types/Command.js";

const PARAMS = [
  "@usuario      → menciona o usuário",
  "@nome         → nome do usuário",
  "@comando      → comando digitado",
  "@parecido     → comando mais parecido",
  "@similaridade → porcentagem de similaridade",
  "@prefixo      → prefixo atual",
  "@bot          → nome do bot",
].join("\n│ ");

const cmdnfCommand: Command = {
  name: "cmdnf",
  aliases: ["cmd404", "comandonf", "naoencontrado"],
  description: "Configura a mensagem de comando não encontrado",
  category: "all",
  ownerOnly: true,
  async execute({ misa, message, from, args }) {
    const config = await getOwnerConfig();

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        {
          text: [
            "╭─「 *CMDNF* 」",
            "│",
            `│ *Modo atual:* ${config.comandoNaoEncontrado.modo}`,
            `│ *Texto atual:* ${config.comandoNaoEncontrado.texto}`,
            "│",
            "│ *Parâmetros disponíveis:*",
            `│ ${PARAMS}`,
            "│",
            "│ *Usos:*",
            "│ cmdnf modo texto",
            "│ cmdnf modo mencao",
            "│ cmdnf texto <mensagem>",
          ].join("\n"),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const action = args[0].toLowerCase();

    if (action === "modo") {
      const modo = args[1]?.toLowerCase();
      if (modo !== "texto" && modo !== "mencao") {
        await misa.sendMessage(
          from,
          { text: "❌ Use: cmdnf modo texto | mencao" },
          { quoted: message as WAMessage },
        );
        return;
      }

      config.comandoNaoEncontrado.modo = modo;
      await saveOwnerConfig(config);

      await misa.sendMessage(
        from,
        { text: `✅ Modo de comando não encontrado atualizado para *${modo}*.` },
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
              "╭─「 *TEXTO CMDNF* 」",
              "│",
              "│ *Parâmetros disponíveis:*",
              `│ ${PARAMS}`,
              "│",
              "│ *Texto atual:*",
              `│ ${config.comandoNaoEncontrado.texto}`,
              "│",
              "╰─ Use: cmdnf texto <mensagem>",
            ].join("\n"),
          },
          { quoted: message as WAMessage },
        );
        return;
      }

      config.comandoNaoEncontrado.texto = args.slice(1).join(" ");
      await saveOwnerConfig(config);

      await misa.sendMessage(
        from,
        { text: `✅ Texto de comando não encontrado atualizado!\n\n${config.comandoNaoEncontrado.texto}` },
        { quoted: message as WAMessage },
      );
      return;
    }

    await misa.sendMessage(
      from,
      {
        text: [
          "╭─「 *CMDNF* 」",
          "│",
          "│ cmdnf modo texto",
          "│ cmdnf modo mencao",
          "│ cmdnf texto <mensagem>",
        ].join("\n"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default cmdnfCommand;
