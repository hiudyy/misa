/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { ErrorCode } from "./localizeError.js";

export type TiktokDownloadResult = {
  urls: string[];
  type: "video" | "image";
  title: string;
  audio: string;
};

type CacheItem = {
  data: TiktokDownloadResult;
  timestamp: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 500;
const REQUEST_TIMEOUT_MS = 60_000;
const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

const TIKTOK_URL_REGEX =
  /^https?:\/\/(?:(?:www|vm|vt)\.)?tiktok\.com\/|^https?:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i;

const cache = new Map<string, CacheItem>();

function getCache(key: string): TiktokDownloadResult | null {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function setCache(key: string, data: TiktokDownloadResult): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }

  cache.set(key, { data, timestamp: Date.now() });
}

export function isValidTiktokURL(urlStr: string): boolean {
  return TIKTOK_URL_REGEX.test(urlStr.trim());
}

/**
 * Baixa vídeo/slideshow do TikTok via tikwm.com.
 */
export async function downloadTiktok(tiktokURL: string): Promise<TiktokDownloadResult> {
  const trimmed = tiktokURL.trim();
  const cacheKey = `download:${trimmed}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const apiURL = `https://www.tikwm.com/api/?url=${encodeURIComponent(trimmed)}`;

  const response = await fetch(apiURL, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.tikwm.com/",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = (await response.json()) as {
    code?: number;
    data?: {
      play?: string;
      title?: string;
      images?: string[];
      music_info?: { play?: string };
    };
  };

  const data = body.data;
  const play = data?.play?.trim() ?? "";
  const images = (data?.images ?? []).filter(Boolean);

  if (body.code !== 0 || (!play && images.length === 0)) {
    throw new Error(ErrorCode.DOWNLOAD_NO_DATA);
  }

  const result: TiktokDownloadResult =
    images.length > 0
      ? {
          type: "image",
          urls: images,
          title: data?.title ?? "",
          audio: data?.music_info?.play ?? "",
        }
      : {
          type: "video",
          urls: [play],
          title: data?.title ?? "",
          audio: data?.music_info?.play ?? "",
        };

  setCache(cacheKey, result);
  return result;
}

/**
 * Pesquisa vídeos no TikTok e retorna um resultado aleatório.
 */
export async function searchTiktok(query: string): Promise<TiktokDownloadResult> {
  const trimmed = query.trim();
  const cacheKey = `search:${trimmed.toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const form = new URLSearchParams({
    keywords: trimmed,
    count: "10",
    cursor: "0",
    HD: "1",
  });

  const response = await fetch("https://www.tikwm.com/api/feed/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": USER_AGENT,
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.tikwm.com/",
    },
    body: form.toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = (await response.json()) as {
    code?: number;
    data?: {
      videos?: Array<{
        play?: string;
        title?: string;
        music_info?: { play?: string };
      }>;
    };
  };

  const videos = body.data?.videos ?? [];
  if (body.code !== 0 || videos.length === 0) {
    throw new Error(ErrorCode.DOWNLOAD_NOT_FOUND);
  }

  const video = videos[Math.floor(Math.random() * videos.length)];
  const play = video.play?.trim() ?? "";
  if (!play) {
    throw new Error(ErrorCode.DOWNLOAD_NOT_FOUND);
  }

  const result: TiktokDownloadResult = {
    type: "video",
    urls: [play],
    title: video.title ?? "",
    audio: video.music_info?.play ?? "",
  };

  setCache(cacheKey, result);
  return result;
}
