import { ErrorCode } from "../../localizeError.js";
import { decodeSavetube, fetchJson } from "../providerHttp.js";
import type { YouTubeProvider } from "../types.js";
import { asString, YOUTUBE_USER_AGENT } from "../utils.js";

export const savetubeProvider: YouTubeProvider = {
  name: "savetube",
  async resolve(videoURL, format, context) {
    const cdn = await fetchJson<{ cdn?: string }>(context, "https://media.savetube.me/api/random-cdn");
    if (!cdn.cdn) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);
    const infoRaw = await fetchJson<{ data?: string }>(context, `https://${cdn.cdn}/v2/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": YOUTUBE_USER_AGENT, Referer: "https://yt.savetube.me/" },
      body: JSON.stringify({ url: videoURL }),
    });
    if (!infoRaw.data) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);
    const info = decodeSavetube(infoRaw.data);
    const quality = format === "mp4" ? "360" : "128";
    const result = await fetchJson<{ data?: { downloadUrl?: string } }>(context, `https://${cdn.cdn}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": YOUTUBE_USER_AGENT, Referer: "https://yt.savetube.me/" },
      body: JSON.stringify({
        downloadType: format === "mp4" ? "video" : "audio",
        quality,
        key: asString(info.key),
      }),
    });
    if (!result.data?.downloadUrl) throw new Error(ErrorCode.DOWNLOAD_NO_MEDIA);
    return {
      url: result.data.downloadUrl,
      title: asString(info.title),
      thumbnail: asString(info.thumbnail),
      quality,
      ext: format,
    };
  },
};
