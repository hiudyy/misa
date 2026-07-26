/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { downloadInstagram, isValidInstagramURL } from "../../../helpers/instagramDownload.js";
import { localizeError } from "../../../helpers/localizeError.js";
import { downloadToTemp } from "../../../media/downloadToTemp.js";
import { runMediaJob } from "../../../media/runMediaJob.js";

const instagramCommand: Command = {
  name: "instagram",
  aliases: ["ig", "insta"],
  description: "Downloads Instagram photos and videos",
  category: "all",
  async execute({ misa, message, from, sender, args, t }) {
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

    await runMediaJob({ misa, from, sender, kind: "instagram", t }, async (signal) => {
      await misa.sendMessage(from, { text: t("commands.instagram.downloading") }, { quoted: message as WAMessage });
      try {
        const data = await downloadInstagram(url, { signal });

        if (data.count === 0) {
          await misa.sendMessage(from, { text: t("commands.instagram.downloadFailed") }, { quoted: message as WAMessage });
          return;
        }

        await misa.sendMessage(from, {
          text: t("commands.instagram.sending", {
            count: String(data.count),
            fileWord: data.count === 1 ? t("common.file") : t("common.files"),
          }),
        }, { quoted: message as WAMessage });

        for (let i = 0; i < data.medias.length; i++) {
          const item = data.medias[i];
          const local = await downloadToTemp({ url: item.url, kind: item.type, signal });
          const caption = i === 0 ? t("commands.instagram.done") : undefined;
          try {
            const isImage = local.contentType.startsWith("image/");
            await misa.sendMessage(from, isImage
              ? { image: { url: local.path }, caption }
              : { video: { url: local.path }, caption }, { quoted: message as WAMessage });
          } finally {
            await local.cleanup();
          }
        }
      } catch (error) {
        await misa.sendMessage(from, {
          text: t("commands.instagram.error", { message: localizeError(error, t, "commands.instagram.unknown") }),
        }, { quoted: message as WAMessage });
      }
    });
  },
};

export default instagramCommand;
