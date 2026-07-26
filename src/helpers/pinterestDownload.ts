/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { ErrorCode } from "./localizeError.js";
import { metrics } from "../metrics.js";

export type PinterestDownloadResult = {
  url: string;
  type: "image" | "video";
};

type CacheItem = {
  data: unknown;
  timestamp: number;
};

const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX = 500;
const REQUEST_TIMEOUT_MS = 30_000;
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.152 Mobile Safari/537.36";
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

const PIN_URL_REGEX =
  /^https?:\/\/(?:[a-zA-Z0-9-]+\.)?pinterest\.\w{2,6}(?:\.\w{2})?\/pin\/\d+|https?:\/\/pin\.it\/[a-zA-Z0-9]+/i;
const PIN_ID_REGEX = /(?:\/pin\/(\d+)|\/pin\/([a-zA-Z0-9]+))/;
const IMG_URL_REGEX = /"(https:\/\/i\.pinimg\.com\/[^"]+)"/g;

const cache = new Map<string, CacheItem>();

type RequestOptions = { signal?: AbortSignal; fetchImpl?: typeof fetch };

function requestSignal(signal: AbortSignal | undefined, timeoutMs = REQUEST_TIMEOUT_MS): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function getCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) {
    metrics.recordCache("pinterest", false);
    return null;
  }

  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    metrics.recordCache("pinterest", false);
    return null;
  }

  metrics.recordCache("pinterest", true);
  return item.data as T;
}

function setCache(key: string, data: unknown): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }

  cache.set(key, { data, timestamp: Date.now() });
}

export function isValidPinURL(urlStr: string): boolean {
  return PIN_URL_REGEX.test(urlStr.trim());
}

export function extractPinID(urlStr: string): string {
  const matches = PIN_ID_REGEX.exec(urlStr);
  if (!matches) return "";
  return matches[1] || matches[2] || "";
}

function upgradeImageQuality(imgURL: string): string {
  return imgURL.replaceAll("236x", "736x").replaceAll("60x60", "736x").replaceAll("170x", "736x");
}

/**
 * Busca imagens no Pinterest (scraping da página de search).
 */
export async function searchPinterest(query: string, options: RequestOptions = {}): Promise<string[]> {
  const trimmed = query.trim();
  const cacheKey = `search:${trimmed.toLowerCase()}`;
  const cached = getCache<string[]>(cacheKey);
  if (cached) return cached;

  const searchURL = `https://br.pinterest.com/search/pins/?q=${encodeURIComponent(trimmed)}`;

  const response = await (options.fetchImpl ?? fetch)(searchURL, {
    headers: { "User-Agent": MOBILE_UA },
    signal: requestSignal(options.signal),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = await response.text();
  const seen = new Set<string>();
  const images: string[] = [];

  for (const match of body.matchAll(IMG_URL_REGEX)) {
    const imgURL = upgradeImageQuality(match[1]);
    if (seen.has(imgURL)) continue;
    seen.add(imgURL);
    images.push(imgURL);
  }

  const limited = images.slice(0, 50);
  if (limited.length > 0) setCache(cacheKey, limited);
  return limited;
}

async function resolveShortPinURL(pinURL: string, options: RequestOptions): Promise<string> {
  if (!pinURL.includes("pin.it")) return pinURL;

  try {
    const response = await (options.fetchImpl ?? fetch)(pinURL, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": DESKTOP_UA },
      signal: requestSignal(options.signal, 10_000),
    });

    const location = response.headers.get("location");
    if (location) return location;
  } catch {
    // mantém URL original
  }

  return pinURL;
}

type PinResourceResponse = {
  resource_response?: {
    data?: {
      videos?: {
        video_list?: Record<string, { url?: string }>;
      };
      images?: Record<string, { url?: string }>;
    };
  };
};

function pickBestImageURL(images: Record<string, { url?: string }>): string {
  let bestURL = "";
  let bestSize = 0;

  for (const [key, img] of Object.entries(images)) {
    if (!img.url) continue;

    let size = 0;
    if (key.includes("orig")) size = 1000;
    else if (key.includes("736")) size = 736;
    else if (key.includes("474")) size = 474;
    else if (key.includes("236")) size = 236;

    if (size > bestSize) {
      bestSize = size;
      bestURL = img.url;
    }
  }

  return bestURL;
}

/**
 * Baixa um pin específico (imagem ou vídeo) via PinResource do Pinterest.
 */
export async function downloadPinterest(pinURL: string, options: RequestOptions = {}): Promise<PinterestDownloadResult> {
  const cacheKey = `download:${pinURL.trim()}`;
  const cached = getCache<PinterestDownloadResult>(cacheKey);
  if (cached) return cached;

  let resolvedURL = await resolveShortPinURL(pinURL.trim(), options);
  const pinID = extractPinID(resolvedURL);
  if (!pinID) {
    throw new Error(ErrorCode.DOWNLOAD_PIN_ID);
  }

  const params = {
    options: {
      id: pinID,
      field_set_key: "auth_web_main_pin",
      noCache: true,
      fetch_visual_search_objects: true,
    },
    context: {},
  };

  const apiURL =
    `https://br.pinterest.com/resource/PinResource/get/?source_url=/pin/${pinID}/&data=` +
    encodeURIComponent(JSON.stringify(params));

  const response = await (options.fetchImpl ?? fetch)(apiURL, {
    headers: { "User-Agent": DESKTOP_UA },
    signal: requestSignal(options.signal),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = (await response.json()) as PinResourceResponse;
  const data = body.resource_response?.data;

  const videoList = data?.videos?.video_list;
  if (videoList) {
    for (const video of Object.values(videoList)) {
      if (video.url) {
        const result: PinterestDownloadResult = { url: video.url, type: "video" };
        setCache(cacheKey, result);
        return result;
      }
    }
  }

  if (data?.images) {
    const bestURL = pickBestImageURL(data.images);
    if (bestURL) {
      const result: PinterestDownloadResult = { url: bestURL, type: "image" };
      setCache(cacheKey, result);
      return result;
    }
  }

  throw new Error(ErrorCode.DOWNLOAD_NO_MEDIA);
}
