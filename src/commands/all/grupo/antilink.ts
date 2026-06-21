/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { AntiLinkPunicao, getGroup, saveGroup } from "../../../database/groupDB.js";
import { getLocalizedCommandWordVars, resolveLocalizedToken } from "../../../helpers/localizedTokens.js";
import { Command } from "../../../types/Command.js";

const antilinkCommand: Command = {
  name: "antilink",
  aliases: ["al"],
  description: "Ativa ou configura o anti-link geral",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args, t, locale }) {
    const config = await getGroup(from);
    const words = getLocalizedCommandWordVars(locale);

    if (args.length === 0) {
      const novoEstado = !config.antilink.ativo;
      await saveGroup(from, { antilink: { ...config.antilink, ativo: novoEstado } });
      await misa.sendMessage(
        from,
        {
          text: novoEstado
            ? t("commands.antilink.enabled")
            : t("commands.antilink.disabled") + "\n\n" + t("commands.antilink.settingsHint", words),
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
          { text: t("commands.antilink.invalidPunishment", words) },
          { quoted: message as WAMessage },
        );
        return;
      }

      await saveGroup(from, { antilink: { ...config.antilink, punicao } });
      await misa.sendMessage(
        from,
        { text: t("commands.antilink.punishmentUpdated", { value: words[punicao === "apagar" ? "delete" : "ban"] }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    if (action === "texto") {
      if (args.length === 1) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.antilink.textHeader", {
              ...words,
              params: t("commands.antilink.params", words),
              current: config.antilink.texto,
            }),
          },
          { quoted: message as WAMessage },
        );
        return;
      }

      const texto = args.slice(1).join(" ");
      await saveGroup(from, { antilink: { ...config.antilink, texto } });
      await misa.sendMessage(
        from,
        { text: t("commands.antilink.textUpdated", { text: texto }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    await misa.sendMessage(
      from,
      {
        text: t("commands.antilink.usage", words),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default antilinkCommand;
