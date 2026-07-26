/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { ErrorCode } from "../localizeError.js";
import { downloadToTemp } from "../../media/downloadToTemp.js";
import type { TempMedia } from "../../media/types.js";
import { createProviderContext } from "./context.js";
import { YouTubeProviderPool } from "./providerPool.js";
import { youtubeProviders } from "./providers/index.js";
import { searchYouTube } from "./search.js";
import { transcodeYouTubeMedia } from "./transcode.js";
import type { YtDownloadResult, YtFormat, YtSearchResult } from "./types.js";
import { getYouTubeVideoID, isYouTubeURL } from "./utils.js";

let defaultPool = new YouTubeProviderPool(youtubeProviders);

export function configureDefaultYouTubePool(options: ConstructorParameters<typeof YouTubeProviderPool>[1]): void {
  defaultPool = new YouTubeProviderPool(youtubeProviders, options);
}

export function getDefaultYouTubePool(): YouTubeProviderPool {
  return defaultPool;
}

export type YouTubeDownloadOptions = {
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  tempDir?: string;
  pool?: YouTubeProviderPool;
  transcode?: (input: TempMedia, format: YtFormat, signal?: AbortSignal) => Promise<TempMedia>;
};

export async function downloadYouTube(
  videoURL: string,
  format: YtFormat,
  options: YouTubeDownloadOptions = {},
): Promise<YtDownloadResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const context = createProviderContext(fetchImpl, options.signal);
  try {
    return await (options.pool ?? defaultPool).run(videoURL, format, context, async (provider, resolution) => {
      let input: TempMedia | undefined;
      try {
        input = await downloadToTemp({
          url: resolution.url,
          headers: resolution.headers,
          kind: format === "mp3" ? "audio" : "video",
          signal: options.signal,
          fetchImpl,
          tempDir: options.tempDir,
        });
        const media = await (options.transcode ?? transcodeYouTubeMedia)(input, format, options.signal);
        return {
          success: true,
          media,
          title: resolution.title,
          thumbnail: resolution.thumbnail,
          quality: resolution.quality,
          duration: resolution.duration,
          author: resolution.author,
          ext: resolution.ext ?? format,
          size: media.size,
          source: provider.name,
        };
      } catch (error) {
        await input?.cleanup().catch(() => undefined);
        throw error;
      }
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `${ErrorCode.DOWNLOAD_FAILED}:${String(error)}`,
    };
  }
}

export async function resolveYouTubeTarget(
  query: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<{ videoURL: string; search?: YtSearchResult }> {
  const trimmed = query.trim();
  if (isYouTubeURL(trimmed)) {
    const videoId = getYouTubeVideoID(trimmed);
    if (!videoId) throw new Error(ErrorCode.INVALID_URL);
    return { videoURL: `https://youtube.com/watch?v=${videoId}` };
  }
  const search = await searchYouTube(trimmed, signal, fetchImpl);
  return { videoURL: search.url, search };
}

export { searchYouTube } from "./search.js";
export {
  formatYtDuration,
  formatYtViews,
  getYouTubeVideoID,
  isYouTubeURL,
  sanitizeYtFileName,
} from "./utils.js";
export type { YtDownloadResult, YtFormat, YtSearchResult } from "./types.js";
export { YouTubeProviderPool } from "./providerPool.js";
export { youtubeProviders } from "./providers/index.js";
