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
  async execute({ misa, message, from, args, t }) {
    const config = await getOwnerConfig();

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.cmdnf.header", {
            mode: config.comandoNaoEncontrado.modo,
            text: config.comandoNaoEncontrado.texto,
            params: t("commands.cmdnf.params"),
          }),
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
          { text: t("commands.cmdnf.invalidMode") },
          { quoted: message as WAMessage },
        );
        return;
      }

      config.comandoNaoEncontrado.modo = modo;
      await saveOwnerConfig(config);

      await misa.sendMessage(
        from,
        { text: t("commands.cmdnf.modeUpdated", { mode: modo }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    if (action === "texto") {
      if (args.length === 1) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.cmdnf.textHeader", {
              current: config.comandoNaoEncontrado.texto,
              params: t("commands.cmdnf.params"),
            }),
          },
          { quoted: message as WAMessage },
        );
        return;
      }

      config.comandoNaoEncontrado.texto = args.slice(1).join(" ");
      await saveOwnerConfig(config);

      await misa.sendMessage(
        from,
        { text: t("commands.cmdnf.textUpdated", { text: config.comandoNaoEncontrado.texto }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    await misa.sendMessage(
      from,
      {
        text: t("commands.cmdnf.usage"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default cmdnfCommand;
