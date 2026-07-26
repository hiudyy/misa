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

const ytmp3Command: Command = {
  name: "ytmp3",
  aliases: ["ytaudio"],
  description: "Downloads YouTube audio from a direct link",
  category: "all",
  async execute({ misa, message, from, sender, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(from, { text: t("commands.ytmp3.usage") }, { quoted: message as WAMessage });
      return;
    }

    const url = args[0].trim();

    if (!isYouTubeURL(url) || !getYouTubeVideoID(url)) {
      await misa.sendMessage(from, { text: t("commands.ytmp3.invalidUrl") }, { quoted: message as WAMessage });
      return;
    }

    await runMediaJob({ misa, from, sender, kind: "youtube-audio", t }, async (signal) => {
      await misa.sendMessage(from, { text: t("commands.ytmp3.downloading") }, { quoted: message as WAMessage });
      let media: Awaited<ReturnType<typeof downloadYouTube>>["media"];
      try {
        const videoURL = `https://youtube.com/watch?v=${getYouTubeVideoID(url)}`;
        const audio = await downloadYouTube(videoURL, "mp3", { signal });
        if (!audio.success || !audio.media) throw new Error(audio.error || t("commands.ytmp3.unknown"));
        media = audio.media;
        const title = audio.title || t("common.file");
        const author = audio.author || t("common.unknown");
        await misa.sendMessage(from, {
          audio: { url: media.path },
          mimetype: "audio/mpeg",
          fileName: `${sanitizeYtFileName(title, "audio")}.mp3`,
          caption: `🎵 *${title}*\n👤 ${author}`,
        }, { quoted: message as WAMessage });
      } catch (error) {
        await misa.sendMessage(from, {
          text: t("commands.ytmp3.error", { message: localizeError(error, t, "commands.ytmp3.unknown") }),
        }, { quoted: message as WAMessage });
      } finally {
        await media?.cleanup();
      }
    });
  },
};

export default ytmp3Command;
