/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import {
  downloadYouTube,
  getYouTubeVideoID,
  isYouTubeURL,
  sanitizeYtFileName,
} from "../../../helpers/youtubeDownload.js";
import { localizeError } from "../../../helpers/localizeError.js";

const ytmp4Command: Command = {
  name: "ytmp4",
  aliases: ["ytvideo", "ytvid"],
  description: "Downloads YouTube video from a direct link",
  category: "all",
  async execute({ misa, message, from, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(from, { text: t("commands.ytmp4.usage") }, { quoted: message as WAMessage });
      return;
    }

    const url = args[0].trim();

    if (!isYouTubeURL(url) || !getYouTubeVideoID(url)) {
      await misa.sendMessage(from, { text: t("commands.ytmp4.invalidUrl") }, { quoted: message as WAMessage });
      return;
    }

    await misa.sendMessage(from, { text: t("commands.ytmp4.downloading") }, { quoted: message as WAMessage });

    try {
      const videoURL = `https://youtube.com/watch?v=${getYouTubeVideoID(url)}`;
      const video = await downloadYouTube(videoURL, "mp4");
      if (!video.success || !video.buffer) {
        throw new Error(video.error || t("commands.ytmp4.unknown"));
      }

      const title = video.title || t("common.file");
      const author = video.author || t("common.unknown");

      if (video.buffer.length > 50 * 1024 * 1024) {
        await misa.sendMessage(
          from,
          {
            document: video.buffer,
            mimetype: "video/mp4",
            fileName: `${sanitizeYtFileName(title, "video")}.mp4`,
            caption: `🎬 *${title}*\n👤 ${author}`,
          },
          { quoted: message as WAMessage },
        );
      } else {
        await misa.sendMessage(
          from,
          {
            video: video.buffer,
            mimetype: "video/mp4",
            fileName: `${sanitizeYtFileName(title, "video")}.mp4`,
            caption: `🎬 *${title}*\n👤 ${author}`,
          },
          { quoted: message as WAMessage },
        );
      }
    } catch (error) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.ytmp4.error", {
            message: localizeError(error, t, "commands.ytmp4.unknown"),
          }),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default ytmp4Command;
