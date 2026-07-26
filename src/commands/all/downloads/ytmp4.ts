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
import { runMediaJob } from "../../../media/runMediaJob.js";

const ytmp4Command: Command = {
  name: "ytmp4",
  aliases: ["ytvideo", "ytvid"],
  description: "Downloads YouTube video from a direct link",
  category: "all",
  async execute({ misa, message, from, sender, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(from, { text: t("commands.ytmp4.usage") }, { quoted: message as WAMessage });
      return;
    }

    const url = args[0].trim();

    if (!isYouTubeURL(url) || !getYouTubeVideoID(url)) {
      await misa.sendMessage(from, { text: t("commands.ytmp4.invalidUrl") }, { quoted: message as WAMessage });
      return;
    }

    await runMediaJob({ misa, from, sender, kind: "youtube-video", t }, async (signal) => {
      await misa.sendMessage(from, { text: t("commands.ytmp4.downloading") }, { quoted: message as WAMessage });
      let media: Awaited<ReturnType<typeof downloadYouTube>>["media"];
      try {
        const videoURL = `https://youtube.com/watch?v=${getYouTubeVideoID(url)}`;
        const video = await downloadYouTube(videoURL, "mp4", { signal });
        if (!video.success || !video.media) throw new Error(video.error || t("commands.ytmp4.unknown"));
        media = video.media;
        const title = video.title || t("common.file");
        const author = video.author || t("common.unknown");
        const common = {
          mimetype: "video/mp4",
          fileName: `${sanitizeYtFileName(title, "video")}.mp4`,
          caption: `🎬 *${title}*\n👤 ${author}`,
        };
        await misa.sendMessage(from, media.size > 50 * 1024 * 1024
          ? { document: { url: media.path }, ...common }
          : { video: { url: media.path }, ...common }, { quoted: message as WAMessage });
      } catch (error) {
        await misa.sendMessage(from, {
          text: t("commands.ytmp4.error", { message: localizeError(error, t, "commands.ytmp4.unknown") }),
        }, { quoted: message as WAMessage });
      } finally {
        await media?.cleanup();
      }
    });
  },
};

export default ytmp4Command;
