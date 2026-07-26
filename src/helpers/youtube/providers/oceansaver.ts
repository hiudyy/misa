import { ErrorCode } from "../../localizeError.js";
import { fetchJson } from "../providerHttp.js";
import type { YouTubeProvider } from "../types.js";
import { asString } from "../utils.js";

export const oceansaverProvider: YouTubeProvider = {
  name: "oceansaver",
  async resolve(videoURL, format, context) {
    const formatParam = format === "mp4" ? "360" : "mp3";
    const started = await fetchJson<{ success?: boolean; id?: string }>(
      context,
      `https://p.oceansaver.in/ajax/download.php?format=${formatParam}&url=${encodeURIComponent(videoURL)}`,
    );
    if (!started.success || !started.id) throw new Error(ErrorCode.DOWNLOAD_FAILED);
    for (let attempt = 0; attempt < 20; attempt++) {
      await context.sleep(3_000);
      const progress = await fetchJson<{ download_url?: string; title?: string }>(
        context,
        `https://p.oceansaver.in/api/progress?id=${encodeURIComponent(started.id)}`,
      );
      if (progress.download_url) {
        return { url: progress.download_url, title: asString(progress.title), ext: format };
      }
    }
    throw new Error(ErrorCode.DOWNLOAD_TIMEOUT);
  },
};
