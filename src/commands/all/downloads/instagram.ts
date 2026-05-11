/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { misakaAPI } from "../../../helpers/misakaAPI.js";

type InstagramResponse = {
  medias: Array<{
    type: "video" | "image";
    url: string;
  }>;
  count: number;
};

const instagramCommand: Command = {
  name: "instagram",
  aliases: ["ig", "insta"],
  description: "Baixa fotos e vídeos do Instagram",
  category: "all",
  async execute({ misa, message, from, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(from, {
        text: t("commands.instagram.usage"),
      });
      return;
    }

    const url = args[0];

    if (!url.includes("instagram.com")) {
      await misa.sendMessage(from, { text: t("commands.instagram.invalidUrl") }, { quoted: message as WAMessage });
      return;
    }

    await misa.sendMessage(from, { text: t("commands.instagram.downloading") }, { quoted: message as WAMessage });

    try {
      const data = await misakaAPI<InstagramResponse>("/instagram/download", { url }, t);

      if (!data || data.count === 0) {
        await misa.sendMessage(from, { text: t("commands.instagram.downloadFailed") }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        {
          text: t("commands.instagram.sending", { 
            count: String(data.count), 
            fileWord: data.count === 1 ? t("common.file") : t("common.files") 
          }),
        },
        { quoted: message as WAMessage },
      );

      for (const media of data.medias) {
        if (media.type === "video") {
          await misa.sendMessage(
            from,
            {
              video: { url: media.url },
              caption: data.medias.indexOf(media) === 0 ? t("commands.instagram.done") : undefined,
            },
            { quoted: message as WAMessage },
          );
        } else {
          await misa.sendMessage(
            from,
            {
              image: { url: media.url },
              caption: data.medias.indexOf(media) === 0 ? t("commands.instagram.done") : undefined,
            },
            { quoted: message as WAMessage },
          );
        }
      }
    } catch (error) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.instagram.error", { message: error instanceof Error ? error.message : t("commands.instagram.unknown") }),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default instagramCommand;
