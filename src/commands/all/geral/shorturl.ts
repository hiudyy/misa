/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const command: Command = {
  name: "shorturl",
  aliases: ["encurtar", "short", "encurtarlink"],
  description: "Encurta um link/URL",
  category: "geral",
  async execute({ misa, message, from, args, t }) {
    if (!args[0]) {
      await misa.sendMessage(from, { text: t("commands.shorturl.usage") }, { quoted: message as WAMessage });
      return;
    }

    let url = args[0];
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    try {
      const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        await misa.sendMessage(from, { text: t("commands.shorturl.error") }, { quoted: message as WAMessage });
        return;
      }

      const shortenedUrl = await response.text();

      if (!shortenedUrl || !shortenedUrl.startsWith("http")) {
        await misa.sendMessage(from, { text: t("commands.shorturl.error") }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        { text: t("commands.shorturl.success", { url: shortenedUrl }) },
        { quoted: message as WAMessage },
      );
    } catch {
      await misa.sendMessage(from, { text: t("commands.shorturl.error") }, { quoted: message as WAMessage });
    }
  },
};

export default command;
