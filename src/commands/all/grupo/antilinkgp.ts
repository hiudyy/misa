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

const antilinkgpCommand: Command = {
  name: "antilinkgp",
  aliases: ["antilinkgrupo", "algp"],
  description: "Ativa ou configura o anti-link de grupo",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args, t }) {
    const config = await getGroup(from);

    if (args.length === 0) {
      const novoEstado = !config.antilinkgp.ativo;
      await saveGroup(from, { antilinkgp: { ...config.antilinkgp, ativo: novoEstado } });
      await misa.sendMessage(
        from,
        {
          text: novoEstado ? t("commands.antilinkgp.enabled") : t("commands.antilinkgp.disabled") + "\n\n" + t("commands.antilinkgp.settingsHint"),
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
          { text: t("commands.antilinkgp.invalidPunishment") },
          { quoted: message as WAMessage },
        );
        return;
      }

      await saveGroup(from, { antilinkgp: { ...config.antilinkgp, punicao } });
      await misa.sendMessage(
        from,
        { text: t("commands.antilinkgp.punishmentUpdated", { value: punicao }) },
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
              params: t("commands.antilinkgp.params"),
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
        text: t("commands.antilinkgp.usage"),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default antilinkgpCommand;
