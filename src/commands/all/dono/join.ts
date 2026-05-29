/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const INVITE_RE = /chat\.whatsapp\.com\/([A-Za-z0-9]+)/i;

const joinCommand: Command = {
  name: "join",
  aliases: ["entrargp", "joingp"],
  i18nAliases: {
    en: ["join", "joingroup"],
    es: ["entrargrupo", "unirsegrupo"],
    id: ["masukgrup", "gabunggrup"],
  },
  description: "Faz o bot entrar em um grupo por link",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, t }) {
    const link = args.join(" ").trim();
    const code = INVITE_RE.exec(link)?.[1];

    if (!code) {
      await misa.sendMessage(from, { text: t("commands.join.invalid") }, { quoted: message as WAMessage });
      return;
    }

    try {
      await misa.groupAcceptInvite(code);
      await misa.sendMessage(from, { text: t("commands.join.success") }, { quoted: message as WAMessage });
    } catch (error) {
      await misa.sendMessage(from, { text: t("commands.join.error", { error: String(error) }) }, { quoted: message as WAMessage });
    }
  },
};

export default joinCommand;