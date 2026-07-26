import { ErrorCode } from "../../localizeError.js";
import { fetchJson } from "../providerHttp.js";
import type { YouTubeProvider } from "../types.js";
import { asString } from "../utils.js";

export const ytconvertProvider: YouTubeProvider = {
  name: "ytconvert",
  async resolve(videoURL, format, context) {
    const payload: Record<string, unknown> = {
      url: videoURL,
      os: "android",
      output: { type: format === "mp3" ? "audio" : "video", format },
    };
    if (format === "mp3") payload.audio = { bitrate: "128k" };
    const started = await fetchJson<{ statusUrl?: string }>(context, "https://hub.ytconvert.org/api/download", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Origin: "https://media.ytmp3.gg",
        Referer: "https://media.ytmp3.gg/",
      },
      body: JSON.stringify(payload),
    });
    if (!started.statusUrl) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);

    for (let attempt = 0; attempt < 30; attempt++) {
      await context.sleep(2_000);
      const status = await fetchJson<{
        status?: string;
        title?: string;
        duration?: string;
        downloadUrl?: string;
        error?: string;
        message?: string;
      }>(context, started.statusUrl, {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0", Referer: "https://media.ytmp3.gg/" },
      });
      if (status.status === "completed" && status.downloadUrl) {
        return {
          url: status.downloadUrl,
          title: asString(status.title),
          duration: asString(status.duration),
          ext: format,
        };
      }
      if (status.status === "failed" || status.error) {
        throw new Error(`${ErrorCode.DOWNLOAD_FAILED}:${status.error || status.message || "unknown"}`);
      }
    }
    throw new Error(ErrorCode.DOWNLOAD_TIMEOUT);
  },
};
