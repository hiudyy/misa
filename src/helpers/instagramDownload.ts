/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { ErrorCode } from "./localizeError.js";
import { metrics } from "../metrics.js";

export type InstagramMedia = {
  type: "video" | "image";
  url: string;
};

export type InstagramDownloadResult = {
  medias: InstagramMedia[];
  count: number;
};

type CacheItem = {
  data: InstagramDownloadResult;
  timestamp: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 500;
const DOWNLOAD_TIMEOUT_MS = 60_000;
const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

const INSTAGRAM_URL_REGEX =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/[\w-]+/i;

const cache = new Map<string, CacheItem>();

type RequestOptions = { signal?: AbortSignal; fetchImpl?: typeof fetch };

function requestSignal(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function getCache(key: string): InstagramDownloadResult | null {
  const item = cache.get(key);
  if (!item) {
    metrics.recordCache("instagram", false);
    return null;
  }

  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    metrics.recordCache("instagram", false);
    return null;
  }

  metrics.recordCache("instagram", true);
  return item.data;
}

function setCache(key: string, data: InstagramDownloadResult): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }

  cache.set(key, { data, timestamp: Date.now() });
}

export function isValidInstagramURL(urlStr: string): boolean {
  return INSTAGRAM_URL_REGEX.test(urlStr.trim());
}

async function detectMediaType(mediaUrl: string, options: RequestOptions): Promise<"video" | "image"> {
  try {
    const response = await (options.fetchImpl ?? fetch)(mediaUrl, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      signal: requestSignal(options.signal, 15_000),
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.startsWith("image/")) return "image";
  } catch {
    // fallback para vídeo se HEAD falhar
  }

  return "video";
}

/**
 * Baixa mídias de um post/reel/IGTV do Instagram via nayan-video-downloader.
 */
export async function downloadInstagram(igURL: string, options: RequestOptions = {}): Promise<InstagramDownloadResult> {
  const trimmed = igURL.trim();
  const cacheKey = `download:${trimmed}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const apiURL = `https://nayan-video-downloader.vercel.app/ndown?url=${encodeURIComponent(trimmed)}`;

  const response = await (options.fetchImpl ?? fetch)(apiURL, {
    headers: { "User-Agent": USER_AGENT },
    signal: requestSignal(options.signal, DOWNLOAD_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = (await response.json()) as { data?: Array<{ url?: string }> };
  const items = body.data ?? [];

  if (items.length === 0) {
    throw new Error(ErrorCode.DOWNLOAD_NOT_FOUND);
  }

  const medias: InstagramMedia[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const mediaUrl = item.url?.trim();
    if (!mediaUrl || seen.has(mediaUrl)) continue;
    seen.add(mediaUrl);

    const type = await detectMediaType(mediaUrl, options);
    medias.push({ type, url: mediaUrl });
  }

  if (medias.length === 0) {
    throw new Error(ErrorCode.DOWNLOAD_NO_MEDIA);
  }

  const result: InstagramDownloadResult = {
    medias,
    count: medias.length,
  };

  setCache(cacheKey, result);
  return result;
}
