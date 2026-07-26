import { ErrorCode } from "../../localizeError.js";
import { fetchJson } from "../providerHttp.js";
import type { YouTubeProvider } from "../types.js";
import { asNumber, asString, YOUTUBE_USER_AGENT } from "../utils.js";

export const nevercapProvider: YouTubeProvider = {
  name: "nevercap",
  async resolve(videoURL, format, context) {
    const headers = { "Content-Type": "application/json", "User-Agent": YOUTUBE_USER_AGENT };
    const started = await fetchJson<{ success?: boolean; data?: { id?: number } }>(
      context,
      "https://nevercap.ai/wapi/fileServer/file/file/uploadUrlOpen",
      { method: "POST", headers, body: JSON.stringify({ url: videoURL, parentId: -1 }) },
    );
    const id = asNumber(started.data?.id);
    if (!started.success || !id) throw new Error(ErrorCode.DOWNLOAD_FAILED);
    for (let attempt = 0; attempt < 15; attempt++) {
      await context.sleep(2_000);
      const checked = await fetchJson<{ data?: { fileMetaInfo?: { fileUrl?: string; fileName?: string; fileType?: string } } }>(
        context,
        "https://nevercap.ai/wapi/fileServer/file/file/uploadUrlStatusOpen",
        { method: "POST", headers, body: JSON.stringify({ id }) },
      );
      const meta = checked.data?.fileMetaInfo;
      if (meta?.fileUrl) {
        return {
          url: meta.fileUrl,
          headers: { Referer: "https://nevercap.ai/", Origin: "https://nevercap.ai" },
          title: asString(meta.fileName),
          ext: asString(meta.fileType).includes("audio") ? "mp3" : format,
        };
      }
    }
    throw new Error(ErrorCode.DOWNLOAD_TIMEOUT);
  },
};
