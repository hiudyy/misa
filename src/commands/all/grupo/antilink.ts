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
  async execute({ misa, message, from, args, t }) {
    const config = await getGroup(from);

    if (args.length === 0) {
      const novoEstado = !config.antilink.ativo;
      await saveGroup(from, { antilink: { ...config.antilink, ativo: novoEstado } });
      await misa.sendMessage(
        from,
        {
          text: novoEstado ? t("commands.antilink.enabled") : t("commands.antilink.disabled") + "\n\n" + t("commands.antilink.settingsHint"),
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
          { text: t("commands.antilink.invalidPunishment") },
          { quoted: message as WAMessage },
        );
        return;
      }

      await saveGroup(from, { antilink: { ...config.antilink, punicao } });
      await misa.sendMessage(
        from,
        { text: t("commands.antilink.punishmentUpdated", { value: punicao }) },
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
              params: t("commands.antilink.params"),
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
        text: t("commands.antilink.usage"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default antilinkCommand;
