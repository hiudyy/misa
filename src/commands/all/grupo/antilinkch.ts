/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { AntiLinkPunicao, getGroup, saveGroup } from "../../../database/groupDB.js";
import { getLocalizedCommandWordVars, resolveLocalizedToken } from "../../../helpers/localizedTokens.js";
import { Command } from "../../../types/Command.js";

const antilinkchCommand: Command = {
  name: "antilinkch",
  aliases: ["antilinkcanal", "alch"],
  description: "Ativa ou configura o anti-link de canal",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args, t, locale }) {
    const config = await getGroup(from);
    const words = getLocalizedCommandWordVars(locale);

    if (args.length === 0) {
      const novoEstado = !config.antilinkch.ativo;
      await saveGroup(from, { antilinkch: { ...config.antilinkch, ativo: novoEstado } });
      await misa.sendMessage(
        from,
        {
          text: novoEstado
            ? t("commands.antilinkch.enabled")
            : t("commands.antilinkch.disabled") + "\n\n" + t("commands.antilinkch.settingsHint", words),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const action = resolveLocalizedToken(locale, args[0], ["punishment", "text"]);

    if (action === "punicao") {
      const punicao = resolveLocalizedToken(locale, args[1], ["delete", "ban"]) as AntiLinkPunicao | null;
      if (punicao !== "apagar" && punicao !== "banir") {
        await misa.sendMessage(
          from,
          { text: t("commands.antilinkch.invalidPunishment", words) },
          { quoted: message as WAMessage },
        );
        return;
      }

      await saveGroup(from, { antilinkch: { ...config.antilinkch, punicao } });
      await misa.sendMessage(
        from,
        { text: t("commands.antilinkch.punishmentUpdated", { value: words[punicao === "apagar" ? "delete" : "ban"] }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    if (action === "texto") {
      if (args.length === 1) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.antilinkch.textHeader", {
              ...words,
              params: t("commands.antilinkch.params", words),
              current: config.antilinkch.texto,
            }),
          },
          { quoted: message as WAMessage },
        );
        return;
      }

      const texto = args.slice(1).join(" ");
      await saveGroup(from, { antilinkch: { ...config.antilinkch, texto } });
      await misa.sendMessage(
        from,
        { text: t("commands.antilinkch.textUpdated", { text: texto }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    await misa.sendMessage(
      from,
      {
        text: t("commands.antilinkch.usage", words),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default antilinkchCommand;
