import { ErrorCode } from "../../localizeError.js";
import { fetchJson } from "../providerHttp.js";
import type { YouTubeProvider } from "../types.js";
import { asString } from "../utils.js";

export const nayanProvider: YouTubeProvider = {
  name: "nayan",
  async resolve(videoURL, format, context) {
    const body = await fetchJson<{
      status?: boolean;
      data?: { title?: string; thumb?: string; audio?: string; video?: string; video_hd?: string; channel?: string; quality?: unknown };
    }>(context, `https://nayan-video-downloader.vercel.app/ytdown?url=${encodeURIComponent(videoURL)}`);
    if (!body.status || !body.data) throw new Error(ErrorCode.DOWNLOAD_FAILED);
    const url = format === "mp3" ? body.data.audio : body.data.video_hd || body.data.video;
    if (!url) throw new Error(ErrorCode.DOWNLOAD_NO_MEDIA);
    return {
      url,
      title: body.data.title,
      thumbnail: body.data.thumb,
      author: body.data.channel,
      quality: asString(body.data.quality),
      ext: format,
    };
  },
};
