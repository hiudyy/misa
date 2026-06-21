/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getLocalizedCommandWordVars, getLocalizedToken, resolveLocalizedToken } from "../../../helpers/localizedTokens.js";
import { getOwnerConfig, saveOwnerConfig } from "../../../ownerConfig.js";
import { Command } from "../../../types/Command.js";

const cmdnfCommand: Command = {
  name: "cmdnf",
  aliases: ["cmd404", "comandonf", "naoencontrado"],
  description: "Configura a mensagem de comando não encontrado",
  category: "all",
  ownerOnly: true,
  async execute({ misa, message, from, args, t, locale }) {
    const config = await getOwnerConfig();
    const words = getLocalizedCommandWordVars(locale);
    const currentMode = config.comandoNaoEncontrado.modo === "mencao"
      ? getLocalizedToken(locale, "mention")
      : getLocalizedToken(locale, "text");

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.cmdnf.header", {
            ...words,
            modeWord: words.mode,
            textWord: words.text,
            mentionWord: words.mention,
            mode: currentMode,
            text: config.comandoNaoEncontrado.texto,
            params: t("commands.cmdnf.params", words),
          }),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const action = resolveLocalizedToken(locale, args[0], ["mode", "text"]);

    if (action === "modo") {
      const modo = resolveLocalizedToken(locale, args[1], ["text", "mention"]);
      if (modo !== "texto" && modo !== "mencao") {
        await misa.sendMessage(
          from,
          { text: t("commands.cmdnf.invalidMode", words) },
          { quoted: message as WAMessage },
        );
        return;
      }

      config.comandoNaoEncontrado.modo = modo;
      await saveOwnerConfig(config);

      await misa.sendMessage(
        from,
        { text: t("commands.cmdnf.modeUpdated", { mode: getLocalizedToken(locale, modo === "mencao" ? "mention" : "text") }) },
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
              ...words,
              modeWord: words.mode,
              textWord: words.text,
              mentionWord: words.mention,
              current: config.comandoNaoEncontrado.texto,
              params: t("commands.cmdnf.params", words),
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
        text: t("commands.cmdnf.usage", words),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default cmdnfCommand;
