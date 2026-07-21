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

const playCommand: Command = {
  name: "play",
  aliases: ["p"],
  description: "Searches for a song on YouTube and sends the audio",
  category: "all",
  async execute({ misa, message, from, args, rawArgs, t, locale }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.play.usage") },
        { quoted: message as WAMessage },
      );
      return;
    }

    const query = rawArgs.trim();
    await misa.sendMessage(from, { text: t("commands.play.searching") }, { quoted: message as WAMessage });

    try {
      const { videoURL, search } = await resolveYouTubeTarget(query);

      if (search) {
        await misa.sendMessage(
          from,
          {
            image: { url: search.thumbnail },
            caption: [
              `🎵 *${search.title}*`,
              "",
              `👤 ${t("commands.play.channel")}: ${search.author}`,
              `⏱️ ${t("commands.play.duration")}: ${search.durationStr || formatYtDuration(search.duration)}`,
              `👀 ${t("commands.play.views")}: ${search.viewsStr || formatYtViews(search.views, locale)}`,
              "",
              t("commands.play.downloading"),
            ].join("\n"),
          },
          { quoted: message as WAMessage },
        );
      } else {
        await misa.sendMessage(from, { text: t("commands.play.downloading") }, { quoted: message as WAMessage });
      }

      const audio = await downloadYouTube(videoURL, "mp3");
      if (!audio.success || !audio.buffer) {
        throw new Error(audio.error || t("commands.play.unknown"));
      }

      const title = audio.title || search?.title || t("common.file");

      await misa.sendMessage(
        from,
        {
          audio: audio.buffer,
          mimetype: "audio/mpeg",
          fileName: `${sanitizeYtFileName(title, "audio")}.mp3`,
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      const msg =
        isErrorCode(error, ErrorCode.INVALID_URL)
          ? t("commands.ytmp3.invalidUrl")
          : t("commands.play.error", {
              message: localizeError(error, t, "commands.play.unknown"),
            });

      await misa.sendMessage(from, { text: msg }, { quoted: message as WAMessage });
    }
  },
};

export default playCommand;
