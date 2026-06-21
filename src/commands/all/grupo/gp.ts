/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getLocalizedCommandWordVars, resolveLocalizedToken } from "../../../helpers/localizedTokens.js";
import { Command } from "../../../types/Command.js";

const gpCommand: Command = {
  name: "gp",
  aliases: ["grupo"],
  description: "Abre ou fecha o grupo. Use: gp a (abrir) ou gp f (fechar)",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args, t, locale }) {
    const words = getLocalizedCommandWordVars(locale);
    const opcao = resolveLocalizedToken(locale, args[0], ["open", "close"]);

    if (opcao !== "open" && opcao !== "close") {
      await misa.sendMessage(
        from,
        {
          text: t("commands.gp.usage", words),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const fechar = opcao === "close";

    await misa.groupSettingUpdate(from, fechar ? "announcement" : "not_announcement");
    await misa.sendMessage(
      from,
      { text: fechar ? t("commands.gp.closed") : t("commands.gp.opened") },
      { quoted: message as WAMessage },
    );
  },
};

export default gpCommand;
