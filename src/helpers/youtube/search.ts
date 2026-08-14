/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { ErrorCode } from "../localizeError.js";
import { metrics } from "../../metrics.js";
import type { YtSearchResult } from "./types.js";
import { asString, navigateJSON, parseDurationString, parseViewsString, YOUTUBE_USER_AGENT } from "./utils.js";

type CacheItem = { data: YtSearchResult; timestamp: number };
const cache = new Map<string, CacheItem>();
const CACHE_TTL_MS = 60 * 60_000;
const CACHE_MAX = 500;

function cached(key: string): YtSearchResult | null {
  const item = cache.get(key);
  if (!item || Date.now() - item.timestamp > CACHE_TTL_MS) {
    if (item) cache.delete(key);
    metrics.recordCache("youtube-search", false);
    return null;
  }
  metrics.recordCache("youtube-search", true);
  return item.data;
}

function setCache(key: string, data: YtSearchResult): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

export async function searchYouTube(query: string, signal?: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<YtSearchResult> {
  const trimmed = query.trim();
  const cacheKey = trimmed.toLowerCase();
  const fromCache = cached(cacheKey);
  if (fromCache) return fromCache;
  const response = await fetchImpl(`https://www.youtube.com/results?search_query=${encodeURIComponent(trimmed)}`, {
    headers: { "User-Agent": YOUTUBE_USER_AGENT, "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${ErrorCode.DOWNLOAD_FAILED}:HTTP_${response.status}`);
  const html = await response.text();

  // Para respostas grandes (>2MB), usar regex mais específico para extrair apenas ytInitialData
  let jsonStr: string | undefined;
  if (html.length > 2 * 1024 * 1024) {
    const startMarker = "var ytInitialData = ";
    const altMarker = "ytInitialData\u0020=\u0020";
    let startIdx = html.indexOf(startMarker);
    let markerLen = startMarker.length;
    if (startIdx === -1) {
      startIdx = html.indexOf(altMarker);
      markerLen = altMarker.length;
    }
    if (startIdx !== -1) {
      const jsonStart = startIdx + markerLen;
      // Encontrar o fim do JSON contando chaves
      let depth = 0;
      let endIdx = jsonStart;
      for (let i = jsonStart; i < html.length; i++) {
        if (html[i] === "{") depth++;
        else if (html[i] === "}") {
          depth--;
          if (depth === 0) { endIdx = i + 1; break; }
        }
      }
      jsonStr = html.slice(jsonStart, endIdx);
    }
  } else {
    const match = /var ytInitialData = (\{.*?\});/s.exec(html) ?? /ytInitialData\s*=\s*(\{.*?\});/s.exec(html);
    jsonStr = match?.[1];
  }

  if (!jsonStr) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);
  const contents = navigateJSON(
    JSON.parse(jsonStr),
    "contents",
    "twoColumnSearchResultsRenderer",
    "primaryContents",
    "sectionListRenderer",
    "contents",
  );
  if (!Array.isArray(contents)) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);
  for (const section of contents) {
    const items = navigateJSON(section, "itemSectionRenderer", "contents");
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const video = navigateJSON(item, "videoRenderer") as Record<string, unknown> | undefined;
      if (!video) continue;
      const videoId = asString(video.videoId);
      if (!videoId) continue;
      const titleRuns = navigateJSON(video, "title", "runs");
      const ownerRuns = navigateJSON(video, "ownerText", "runs");
      const thumbnails = navigateJSON(video, "thumbnail", "thumbnails");
      const durationStr = asString(navigateJSON(video, "lengthText", "simpleText"));
      const viewsStr = asString(navigateJSON(video, "viewCountText", "simpleText"));
      const result: YtSearchResult = {
        videoId,
        url: `https://youtube.com/watch?v=${videoId}`,
        title: Array.isArray(titleRuns) ? asString((titleRuns[0] as { text?: string } | undefined)?.text) : "",
        thumbnail: Array.isArray(thumbnails) ? asString((thumbnails.at(-1) as { url?: string } | undefined)?.url) : "",
        duration: parseDurationString(durationStr),
        durationStr,
        views: parseViewsString(viewsStr),
        viewsStr,
        author: Array.isArray(ownerRuns) ? asString((ownerRuns[0] as { text?: string } | undefined)?.text) : "",
        ago: asString(navigateJSON(video, "publishedTimeText", "simpleText")),
      };
      setCache(cacheKey, result);
      return result;
    }
  }
  throw new Error(ErrorCode.DOWNLOAD_NOT_FOUND);
}
