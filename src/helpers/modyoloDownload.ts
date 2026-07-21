/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { ErrorCode } from "./localizeError.js";

const MODYOLO_BASE = "https://modyolo.com";
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX = 100;
const TIMEOUT_MS = 30_000;

export type ModyoloSearchResult = {
  name: string;
  url: string;
  version: string;
  size: string;
  modInfo: string;
  imageURL: string;
};

export type ModyoloAppInfo = {
  name: string;
  version: string;
  size: string;
  modInfo: string;
  description: string;
  publisher: string;
  genre: string;
  bannerURL: string;
  imageURL: string;
  downloadURL: string;
  downloadPage: string;
};

export type ModyoloVersion = {
  version: string;
  size: string;
  downloadID: string;
};

type CacheItem = { data: unknown; timestamp: number };
const cache = new Map<string, CacheItem>();

function getCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCache(key: string, data: unknown): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchHtml(url: string, referer = MODYOLO_BASE): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: referer,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function parseModyoloSearchResults(html: string): ModyoloSearchResult[] {
  const results: ModyoloSearchResult[] = [];
  const blocks = html.split('class="col-12 col-md-6 col-xl-4 mb-3"');

  for (const block of blocks.slice(1)) {
    const url = /href="([^"]*)"/.exec(block)?.[1]?.trim() ?? "";
    const name = /<h3[^>]*>([^<]*)<\/h3>/.exec(block)?.[1]?.trim() ?? "";
    const version =
      /<svg[^>]*><\/svg>\s*<span class="align-middle">\s*([^<]*)\s*<\/span>/s.exec(block)?.[1]?.trim() ?? "";
    const size =
      /\+\s*<\/span>\s*<span class="align-middle">\s*([^<]*)\s*<\/span>/s.exec(block)?.[1]?.trim() ?? "";
    const modInfo =
      /<svg[^>]*path[^>]*><\/svg>\s*<span class="align-middle">\s*([^<]*)\s*<\/span>\s*<\/div>\s*<\/div>/s.exec(
        block,
      )?.[1]?.trim() ?? "";
    const imageURL =
      /src="([^"]*(?:150x150|\.jpg|\.png|\.webp)[^"]*)"/.exec(block)?.[1]?.trim() ?? "";

    if (name && url) {
      results.push({ name, url, version, size, modInfo, imageURL });
    }
  }

  return results;
}

export async function searchModyolo(query: string): Promise<ModyoloSearchResult[]> {
  const trimmed = query.trim();
  const cacheKey = `search:${trimmed.toLowerCase()}`;
  const cached = getCache<ModyoloSearchResult[]>(cacheKey);
  if (cached) return cached;

  const searchURL = `${MODYOLO_BASE}/?s=${encodeURIComponent(trimmed)}`;
  const html = await fetchHtml(searchURL);
  const results = parseModyoloSearchResults(html);
  if (results.length > 0) setCache(cacheKey, results);
  return results;
}

export async function getModyoloAppInfo(pageURL: string): Promise<ModyoloAppInfo> {
  const cacheKey = `app:${pageURL}`;
  const cached = getCache<ModyoloAppInfo>(cacheKey);
  if (cached) return cached;

  const html = await fetchHtml(pageURL);
  const info: ModyoloAppInfo = {
    name: "",
    version: "",
    size: "",
    modInfo: "",
    description: "",
    publisher: "",
    genre: "",
    bannerURL: "",
    imageURL: "",
    downloadURL: "",
    downloadPage: "",
  };

  info.name = /<h1[^>]*>([^<]*)<\/h1>/.exec(html)?.[1]?.trim() ?? "";
  const versionFromName = /v([0-9.]+)/.exec(info.name);
  if (versionFromName) info.version = versionFromName[1];

  info.bannerURL =
    /<img[^>]*class="[^"]*rounded-lg d-block[^"]*"[^>]*src="([^"]*)"/.exec(html)?.[1]?.trim() ?? "";
  info.imageURL =
    /<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]*)"/.exec(html)?.[1]?.trim() ?? "";

  const tableHTML = /<table[^>]*>[\s\S]*?<\/table>/.exec(html)?.[0] ?? "";
  if (tableHTML) {
    const pick = (label: string, allowAnchor = false): string => {
      const pattern = allowAnchor
        ? new RegExp(`${label}\\s*</th>\\s*<td[^>]*>(?:<a[^>]*>)?([^<]*)(?:</a>)?</td>`, "is")
        : new RegExp(`${label}\\s*</th>\\s*<td[^>]*>([^<]*)</td>`, "is");
      return pattern.exec(tableHTML)?.[1]?.trim() ?? "";
    };

    info.name = pick("App Name") || info.name;
    info.publisher = pick("Publisher", true);
    info.genre = pick("Genre", true);
    info.size = pick("Size");
    info.version = pick("Latest Version") || info.version;
    info.modInfo = pick("MOD Info");
  }

  const descMatch = /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(html);
  if (descMatch) info.description = stripTags(descMatch[1]);

  const dlMatch = /href="([^"]*download[^"]*)"/.exec(html);
  if (dlMatch) {
    info.downloadPage = dlMatch[1].startsWith("http") ? dlMatch[1] : `${MODYOLO_BASE}${dlMatch[1]}`;
  }

  if (info.name) setCache(cacheKey, info);
  return info;
}

export function parseModyoloVersions(html: string): { versions: ModyoloVersion[]; directDownloadID: string } {
  const versions: ModyoloVersion[] = [];
  const blocks =
    html.match(/<div class="border rounded mb-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g) ?? [];

  for (const block of blocks) {
    const version = /href="#version-\d+"\s*>\s*([^<]*)\s*<\/a>/.exec(block)?.[1]?.trim() ?? "";
    const downloadID = /href="[^"]*download\/[^"]*\/(\d+)"/.exec(block)?.[1]?.trim() ?? "";
    const size =
      /<span class="text-muted d-block ml-auto">([^<]*)<\/span>/s.exec(block)?.[1]?.trim() ?? "";

    if (version && downloadID) {
      versions.push({ version, size, downloadID });
    }
  }

  let directDownloadID = "";
  if (versions.length === 0) {
    directDownloadID = /href="[^"]*download\/[^"]+\/(\d+)"/.exec(html)?.[1] ?? "";
  }

  return { versions, directDownloadID };
}

export async function getModyoloVersions(
  downloadPageURL: string,
): Promise<{ versions: ModyoloVersion[]; directDownloadID: string }> {
  const html = await fetchHtml(downloadPageURL, downloadPageURL);
  return parseModyoloVersions(html);
}

export async function getModyoloDownloadLink(downloadID: string, downloadPage: string): Promise<string> {
  const cacheKey = `download:${downloadID}`;
  const cached = getCache<string>(cacheKey);
  if (cached) return cached;

  const refererBase = downloadPage.startsWith("http")
    ? downloadPage.replace(/\/$/, "")
    : `${MODYOLO_BASE}/${downloadPage.replace(/^\//, "")}`;
  const referer = `${refererBase}/${downloadID}`;

  const response = await fetch(`${MODYOLO_BASE}/wp-admin/admin-ajax.php`, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "text/html,*/*",
      Referer: referer,
      "X-Requested-With": "XMLHttpRequest",
    },
    body: "action=k_get_download",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const downloadURL = /href="([^"]*)"[^>]*download/.exec(html)?.[1]?.trim();
  if (!downloadURL) throw new Error(ErrorCode.DOWNLOAD_LINK_NOT_FOUND);

  setCache(cacheKey, downloadURL);
  return downloadURL;
}

export async function shortenUrl(longURL: string): Promise<string> {
  if (!longURL) return "";
  try {
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longURL)}`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return longURL;
    const shortened = (await response.text()).trim();
    return shortened.startsWith("http") ? shortened : longURL;
  } catch {
    return longURL;
  }
}

export function buildModyoloAppInfoText(
  appInfo: ModyoloAppInfo,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  let info = `📱 *${appInfo.name}*`;
  if (appInfo.version) info += `\n📦 ${t("commands.apk.labelVersion")}: ${appInfo.version}`;
  if (appInfo.modInfo) info += `\n🔧 ${t("commands.apk.labelMod")}: ${appInfo.modInfo}`;
  if (appInfo.size) info += `\n📏 ${t("commands.apk.labelSize")}: ${appInfo.size}`;
  if (appInfo.publisher) info += `\n👨‍💻 ${t("commands.apk.labelPublisher")}: ${appInfo.publisher}`;
  if (appInfo.genre) info += `\n🎮 ${t("commands.apk.labelGenre")}: ${appInfo.genre}`;
  if (appInfo.description) {
    const desc = appInfo.description.length > 200 ? `${appInfo.description.slice(0, 200)}...` : appInfo.description;
    info += `\n\n📝 ${desc}`;
  }
  return info;
}
