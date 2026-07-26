import { ErrorCode } from "../../localizeError.js";
import { fetchJson, providerSignal, PROVIDER_DOWNLOAD_TIMEOUT_MS } from "../providerHttp.js";
import type { YouTubeProvider } from "../types.js";
import { asString } from "../utils.js";

export const lukaProvider: YouTubeProvider = {
  name: "luka",
  supports: (format) => format === "mp3",
  async resolve(videoURL, _format, context) {
    const form = new FormData();
    form.append("url", videoURL);
    const userAgent = "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 Chrome/145.0.0.0 Mobile Safari/537.36";
    const info = await fetchJson<{ id?: string; title?: string; thumbnail?: string }>(
      context,
      "https://lukavukanovic.xyz/yt-downloader/info",
      {
        method: "POST",
        headers: { Accept: "*/*", Origin: "https://lukavukanovic.xyz", Referer: "https://lukavukanovic.xyz/yt-downloader/", "User-Agent": userAgent },
        body: form,
      },
    );
    if (!info.id) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);
    const job = await fetchJson<{ jobID?: string }>(context, "https://lukavukanovic.xyz/yt-downloader/download", {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        Origin: "https://lukavukanovic.xyz",
        Referer: "https://lukavukanovic.xyz/yt-downloader/",
        "User-Agent": userAgent,
      },
      body: JSON.stringify({ videoID: info.id, quality: "high", filename: info.title, normalize: true }),
    });
    if (!job.jobID) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);

    const response = await context.fetch(`https://lukavukanovic.xyz/yt-downloader/events?id=${encodeURIComponent(job.jobID)}`, {
      headers: { Accept: "text/event-stream", "Cache-Control": "no-cache", Referer: "https://lukavukanovic.xyz/yt-downloader/", Origin: "https://lukavukanovic.xyz" },
      signal: providerSignal(context, PROVIDER_DOWNLOAD_TIMEOUT_MS * 2),
    });
    if (!response.ok || !response.body) throw new Error(ErrorCode.DOWNLOAD_FAILED);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let leftover = "";
    let filePath = "";
    while (!filePath) {
      const { done, value } = await reader.read();
      if (done) break;
      leftover += decoder.decode(value, { stream: true });
      const lines = leftover.split(/\r?\n/);
      leftover = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const event = JSON.parse(payload) as { status?: string; filePath?: string; error?: string };
          const status = asString(event.status).toLowerCase();
          if (status === "complete" && event.filePath) filePath = asString(event.filePath);
          if (status === "error" || status === "failed") throw new Error(event.error || ErrorCode.DOWNLOAD_FAILED);
        } catch (error) {
          if (error instanceof SyntaxError) continue;
          throw error;
        }
      }
    }
    if (!filePath) throw new Error(ErrorCode.DOWNLOAD_TIMEOUT);
    return {
      url: `https://lukavukanovic.xyz/yt-downloader/${filePath.replace(/^\//, "")}`,
      headers: { Referer: "https://lukavukanovic.xyz/yt-downloader/", Origin: "https://lukavukanovic.xyz" },
      title: info.title,
      thumbnail: info.thumbnail,
      ext: "mp3",
    };
  },
};
