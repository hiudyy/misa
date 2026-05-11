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

const antilinkchCommand: Command = {
  name: "antilinkch",
  aliases: ["antilinkcanal", "alch"],
  description: "Ativa ou configura o anti-link de canal",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args, t }) {
    const config = await getGroup(from);

    if (args.length === 0) {
      const novoEstado = !config.antilinkch.ativo;
      await saveGroup(from, { antilinkch: { ...config.antilinkch, ativo: novoEstado } });
      await misa.sendMessage(
        from,
        {
          text: novoEstado ? t("commands.antilinkch.enabled") : t("commands.antilinkch.disabled") + "\n\n" + t("commands.antilinkch.settingsHint"),
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
          { text: t("commands.antilinkch.invalidPunishment") },
          { quoted: message as WAMessage },
        );
        return;
      }

      await saveGroup(from, { antilinkch: { ...config.antilinkch, punicao } });
      await misa.sendMessage(
        from,
        { text: t("commands.antilinkch.punishmentUpdated", { value: punicao }) },
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
              params: t("commands.antilinkch.params"),
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
        text: t("commands.antilinkch.usage"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default antilinkchCommand;
