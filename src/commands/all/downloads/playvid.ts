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
import { runMediaJob } from "../../../media/runMediaJob.js";
import { downloadToTemp } from "../../../media/downloadToTemp.js";

const playvidCommand: Command = {
  name: "playvid",
  aliases: ["pv", "playvideo", "videoplay"],
  description: "Searches for a video on YouTube and sends it",
  category: "all",
  async execute({ misa, message, from, sender, args, rawArgs, t, locale }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.playvid.usage") },
        { quoted: message as WAMessage },
      );
      return;
    }

    const query = rawArgs.trim();
    await runMediaJob({ misa, from, sender, kind: "youtube-video", t }, async (signal) => {
      await misa.sendMessage(from, { text: t("commands.playvid.searching") }, { quoted: message as WAMessage });
      let media: Awaited<ReturnType<typeof downloadYouTube>>["media"];
      try {
        const { videoURL, search } = await resolveYouTubeTarget(query, signal);

        if (search?.thumbnail) {
          let thumbnail: Awaited<ReturnType<typeof downloadToTemp>> | undefined;
          try {
            thumbnail = await downloadToTemp({ url: search.thumbnail, kind: "image", signal });
            await misa.sendMessage(from, {
              image: { url: thumbnail.path },
              caption: [
               `🎬 *${search.title}*`,
              "",
              `👤 ${t("commands.playvid.channel")}: ${search.author}`,
              `⏱️ ${t("commands.playvid.duration")}: ${search.durationStr || formatYtDuration(search.duration)}`,
              `👀 ${t("commands.playvid.views")}: ${search.viewsStr || formatYtViews(search.views, locale)}`,
              "",
              t("commands.playvid.downloading"),
              ].join("\n"),
            }, { quoted: message as WAMessage });
          } catch {
            await misa.sendMessage(from, { text: t("commands.playvid.downloading") }, { quoted: message as WAMessage });
          } finally {
            await thumbnail?.cleanup();
          }
        } else {
          await misa.sendMessage(from, { text: t("commands.playvid.downloading") }, { quoted: message as WAMessage });
        }

        const video = await downloadYouTube(videoURL, "mp4", { signal });
        if (!video.success || !video.media) throw new Error(video.error || t("commands.playvid.unknown"));
        media = video.media;

        const title = video.title || search?.title || t("common.file");
        const author = video.author || search?.author || "";
        const common = {
          mimetype: "video/mp4",
          fileName: `${sanitizeYtFileName(title, "video")}.mp4`,
          caption: `🎬 *${title}*${author ? `\n👤 ${author}` : ""}`,
        };

        await misa.sendMessage(from, media.size > 50 * 1024 * 1024
          ? { document: { url: media.path }, ...common }
          : { video: { url: media.path }, ...common }, { quoted: message as WAMessage });
      } catch (error) {
        const msg = isErrorCode(error, ErrorCode.INVALID_URL)
          ? t("commands.ytmp4.invalidUrl")
          : t("commands.playvid.error", { message: localizeError(error, t, "commands.playvid.unknown") });
        await misa.sendMessage(from, { text: msg }, { quoted: message as WAMessage });
      } finally {
        await media?.cleanup();
      }
    });
  },
};

export default playvidCommand;
