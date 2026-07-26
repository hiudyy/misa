import { ErrorCode } from "../../localizeError.js";
import { fetchJson } from "../providerHttp.js";
import type { YouTubeProvider } from "../types.js";
import { asNumber, asString, getYouTubeVideoID } from "../utils.js";

export const flvtoProvider: YouTubeProvider = {
  name: "flvto",
  async resolve(videoURL, format, context) {
    const videoID = getYouTubeVideoID(videoURL) || (/^[a-zA-Z0-9_-]{11}$/.test(videoURL.trim()) ? videoURL.trim() : "");
    if (!videoID) throw new Error(ErrorCode.DOWNLOAD_INVALID_URL);
    const referer = `https://ht.flvto.online/button?url=https://www.youtube.com/watch?v=${videoID}&fileType=${format}`;
    const data = await fetchJson<{
      title?: string;
      duration?: string;
      link?: string;
      formats?: Array<{ url?: string; qualityLabel?: string; height?: number }>;
    }>(context, "https://ht.flvto.online/converter", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
        "Content-Type": "application/json",
        Origin: "https://ht.flvto.online",
        Referer: referer,
      },
      body: JSON.stringify({ id: videoID, fileType: format }),
    });
    let url = format === "mp3" ? asString(data.link) : "";
    let quality = "";
    if (format === "mp4") {
      let bestHeight = -1;
      for (const item of data.formats ?? []) {
        const candidate = asString(item.url);
        if (!candidate) continue;
        if (item.qualityLabel === "720p") {
          url = candidate;
          quality = "720p";
          break;
        }
        const height = asNumber(item.height);
        if (height > bestHeight) {
          bestHeight = height;
          url = candidate;
          quality = asString(item.qualityLabel);
        }
      }
    }
    if (!url) throw new Error(ErrorCode.DOWNLOAD_NO_MEDIA);
    return {
      url,
      headers: {
        Referer: "https://ht.flvto.online/",
        Origin: "https://ht.flvto.online",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
      },
      title: asString(data.title),
      duration: asString(data.duration),
      quality,
      ext: format,
    };
  },
};
