/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import type { TempMedia } from "../../media/types.js";

export type YtFormat = "mp3" | "mp4";

export type YtProviderResolution = {
  url: string;
  headers?: Record<string, string>;
  title?: string;
  thumbnail?: string;
  quality?: string;
  duration?: string;
  author?: string;
  ext?: string;
};

export type YtProviderContext = {
  fetch: typeof fetch;
  signal?: AbortSignal;
  sleep: (ms: number) => Promise<void>;
};

export type YouTubeProvider = {
  name: string;
  supports?: (format: YtFormat) => boolean;
  resolve: (url: string, format: YtFormat, context: YtProviderContext) => Promise<YtProviderResolution>;
};

export type YtDownloadResult = {
  success: boolean;
  media?: TempMedia;
  title?: string;
  thumbnail?: string;
  quality?: string;
  duration?: string;
  author?: string;
  ext?: string;
  size?: number;
  source?: string;
  error?: string;
};

export type YtSearchResult = {
  videoId: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationStr: string;
  views: number;
  viewsStr: string;
  author: string;
  ago: string;
};
