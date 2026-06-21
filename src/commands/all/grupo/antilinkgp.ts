/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { AntiLinkPunicao, getGroup, saveGroup } from "../../../database/groupDB.js";
import { getLocalizedCommandWordVars, resolveLocalizedToken } from "../../../helpers/localizedTokens.js";
import { Command } from "../../../types/Command.js";

const antilinkgpCommand: Command = {
  name: "antilinkgp",
  aliases: ["antilinkgrupo", "algp"],
  description: "Ativa ou configura o anti-link de grupo",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args, t, locale }) {
    const config = await getGroup(from);
    const words = getLocalizedCommandWordVars(locale);

    if (args.length === 0) {
      const novoEstado = !config.antilinkgp.ativo;
      await saveGroup(from, { antilinkgp: { ...config.antilinkgp, ativo: novoEstado } });
      await misa.sendMessage(
        from,
        {
          text: novoEstado
            ? t("commands.antilinkgp.enabled")
            : t("commands.antilinkgp.disabled") + "\n\n" + t("commands.antilinkgp.settingsHint", words),
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
          { text: t("commands.antilinkgp.invalidPunishment", words) },
          { quoted: message as WAMessage },
        );
        return;
      }

      await saveGroup(from, { antilinkgp: { ...config.antilinkgp, punicao } });
      await misa.sendMessage(
        from,
        { text: t("commands.antilinkgp.punishmentUpdated", { value: words[punicao === "apagar" ? "delete" : "ban"] }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    if (action === "texto") {
      if (args.length === 1) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.antilinkgp.textHeader", {
              ...words,
              params: t("commands.antilinkgp.params", words),
              current: config.antilinkgp.texto,
            }),
          },
          { quoted: message as WAMessage },
        );
        return;
      }

      const texto = args.slice(1).join(" ");
      await saveGroup(from, { antilinkgp: { ...config.antilinkgp, texto } });
      await misa.sendMessage(
        from,
        { text: t("commands.antilinkgp.textUpdated", { text: texto }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    await misa.sendMessage(
      from,
      {
        text: t("commands.antilinkgp.usage", words),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default antilinkgpCommand;
