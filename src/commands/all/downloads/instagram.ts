/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { downloadInstagram, isValidInstagramURL } from "../../../helpers/instagramDownload.js";
import { localizeError } from "../../../helpers/localizeError.js";

const instagramCommand: Command = {
  name: "instagram",
  aliases: ["ig", "insta"],
  description: "Downloads Instagram photos and videos",
  category: "all",
  async execute({ misa, message, from, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(from, {
        text: t("commands.instagram.usage"),
      });
      return;
    }

    const url = args[0];

    if (!isValidInstagramURL(url)) {
      await misa.sendMessage(from, { text: t("commands.instagram.invalidUrl") }, { quoted: message as WAMessage });
      return;
    }

    await misa.sendMessage(from, { text: t("commands.instagram.downloading") }, { quoted: message as WAMessage });

    try {
      const data = await downloadInstagram(url);

      if (data.count === 0) {
        await misa.sendMessage(from, { text: t("commands.instagram.downloadFailed") }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        {
          text: t("commands.instagram.sending", {
            count: String(data.count),
            fileWord: data.count === 1 ? t("common.file") : t("common.files"),
          }),
        },
        { quoted: message as WAMessage },
      );

      for (let i = 0; i < data.medias.length; i++) {
        const media = data.medias[i];
        const caption = i === 0 ? t("commands.instagram.done") : undefined;

        if (media.type === "video") {
          await misa.sendMessage(
            from,
            {
              video: { url: media.url },
              caption,
            },
            { quoted: message as WAMessage },
          );
        } else {
          await misa.sendMessage(
            from,
            {
              image: { url: media.url },
              caption,
            },
            { quoted: message as WAMessage },
          );
        }
      }
    } catch (error) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.instagram.error", {
            message: localizeError(error, t, "commands.instagram.unknown"),
          }),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default instagramCommand;
