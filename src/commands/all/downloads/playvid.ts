/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import {
  downloadYouTube,
  formatYtDuration,
  formatYtViews,
  resolveYouTubeTarget,
  sanitizeYtFileName,
} from "../../../helpers/youtubeDownload.js";
import { ErrorCode, isErrorCode, localizeError } from "../../../helpers/localizeError.js";

const playvidCommand: Command = {
  name: "playvid",
  aliases: ["pv", "playvideo", "videoplay"],
  description: "Searches for a video on YouTube and sends it",
  category: "all",
  async execute({ misa, message, from, args, rawArgs, t, locale }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.playvid.usage") },
        { quoted: message as WAMessage },
      );
      return;
    }

    const query = rawArgs.trim();
    await misa.sendMessage(from, { text: t("commands.playvid.searching") }, { quoted: message as WAMessage });

    try {
      const { videoURL, search } = await resolveYouTubeTarget(query);

      if (search) {
        await misa.sendMessage(
          from,
          {
            image: { url: search.thumbnail },
            caption: [
              `🎬 *${search.title}*`,
              "",
              `👤 ${t("commands.playvid.channel")}: ${search.author}`,
              `⏱️ ${t("commands.playvid.duration")}: ${search.durationStr || formatYtDuration(search.duration)}`,
              `👀 ${t("commands.playvid.views")}: ${search.viewsStr || formatYtViews(search.views, locale)}`,
              "",
              t("commands.playvid.downloading"),
            ].join("\n"),
          },
          { quoted: message as WAMessage },
        );
      } else {
        await misa.sendMessage(from, { text: t("commands.playvid.downloading") }, { quoted: message as WAMessage });
      }

      const video = await downloadYouTube(videoURL, "mp4");
      if (!video.success || !video.buffer) {
        throw new Error(video.error || t("commands.playvid.unknown"));
      }

      const title = video.title || search?.title || t("common.file");
      const author = video.author || search?.author || "";

      if (video.buffer.length > 50 * 1024 * 1024) {
        await misa.sendMessage(
          from,
          {
            document: video.buffer,
            mimetype: "video/mp4",
            fileName: `${sanitizeYtFileName(title, "video")}.mp4`,
            caption: `🎬 *${title}*${author ? `\n👤 ${author}` : ""}`,
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
            caption: `🎬 *${title}*${author ? `\n👤 ${author}` : ""}`,
          },
          { quoted: message as WAMessage },
        );
      }
    } catch (error) {
      const msg =
        isErrorCode(error, ErrorCode.INVALID_URL)
          ? t("commands.ytmp4.invalidUrl")
          : t("commands.playvid.error", {
              message: localizeError(error, t, "commands.playvid.unknown"),
            });

      await misa.sendMessage(from, { text: msg }, { quoted: message as WAMessage });
    }
  },
};

export default playvidCommand;
