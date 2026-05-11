/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const gpCommand: Command = {
  name: "gp",
  aliases: ["grupo"],
  description: "Abre ou fecha o grupo. Use: gp a (abrir) ou gp f (fechar)",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args, t }) {
    const opcao = args[0]?.toLowerCase();

    if (opcao !== "a" && opcao !== "f") {
      await misa.sendMessage(
        from,
        {
          text: t("commands.gp.usage"),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const fechar = opcao === "f";

    await misa.groupSettingUpdate(from, fechar ? "announcement" : "not_announcement");
    await misa.sendMessage(
      from,
      { text: fechar ? t("commands.gp.closed") : t("commands.gp.opened") },
      { quoted: message as WAMessage },
    );
  },
};

export default gpCommand;
