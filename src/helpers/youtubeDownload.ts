/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { createDecipheriv } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { paths } from "../config/paths.js";
import { ErrorCode } from "./localizeError.js";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export type YtFormat = "mp3" | "mp4";

export type YtDownloadResult = {
  success: boolean;
  buffer?: Buffer;
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

const TIMEOUT_MS = 60_000;
const DOWNLOAD_TIMEOUT_MS = 180_000;
const COOLDOWN_MS = 5 * 60 * 60 * 1000;
const MAX_FAILURES = 3;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 500;
const MAX_BYTES = 80 * 1024 * 1024;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const SAVETUBE_KEY_DEFAULT = "C5D58EF67A7584E4A29F6C35BBC4EB12";
const BRONXYSHOST_KEY = "juniornerd_ISM";

const VIDEO_ID_RE =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

type CacheItem = { data: unknown; timestamp: number };
const cache = new Map<string, CacheItem>();

let providerOrder = ["nayan", "flvto", "ytconvert", "nevercap", "oceansaver", "savetube", "bronxyshost", "luka"];
const providerCooldowns = new Map<string, number>();
const providerFailures = new Map<string, number>();

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

export function getYouTubeVideoID(urlStr: string): string {
  const match = VIDEO_ID_RE.exec(urlStr);
  return match?.[1] ?? "";
}

export function isYouTubeURL(urlStr: string): boolean {
  return urlStr.includes("youtube.com") || urlStr.includes("youtu.be");
}

export function formatYtDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatYtViews(views: number, locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale, { notation: "compact", compactDisplay: "short" }).format(views);
}

export function sanitizeYtFileName(input: string, fallback = "media"): string {
  return input.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, 120) || fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function snippet(data: Buffer | string, max = 180): string {
  const text = typeof data === "string" ? data : data.toString("utf8");
  return text.slice(0, max).trim();
}

function looksLikeMedia(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  return ct.startsWith("audio/") || ct.startsWith("video/");
}

function looksLikeText(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  return ct.startsWith("text/") || ct.includes("json") || ct.includes("xml") || ct.includes("html");
}

async function downloadBinary(
  downloadURL: string,
  source: string,
  extraHeaders: Record<string, string> = {},
): Promise<Buffer> {
  const response = await fetch(downloadURL, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "*/*",
      ...extraHeaders,
    },
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const buffer = Buffer.from(await response.arrayBuffer());

  if (!response.ok) {
    throw new Error(`${ErrorCode.DOWNLOAD_FAILED}:HTTP_${response.status}`);
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error(ErrorCode.DOWNLOAD_FAILED);
  }
  if (buffer.length < 1000 && !looksLikeMedia(contentType)) {
    throw new Error(ErrorCode.DOWNLOAD_FAILED);
  }
  if (buffer.length < 1000 && looksLikeText(contentType)) {
    throw new Error(ErrorCode.DOWNLOAD_FAILED);
  }

  void source;
  return buffer;
}

function isProviderInCooldown(provider: string): boolean {
  const until = providerCooldowns.get(provider);
  if (!until) return false;
  if (Date.now() >= until) {
    providerCooldowns.delete(provider);
    providerFailures.delete(provider);
    return false;
  }
  return true;
}

function recordProviderFailure(provider: string): void {
  const count = (providerFailures.get(provider) ?? 0) + 1;
  providerFailures.set(provider, count);
  if (count >= MAX_FAILURES) {
    providerCooldowns.set(provider, Date.now() + COOLDOWN_MS);
  }
}

function resetProviderFailures(provider: string): void {
  providerFailures.delete(provider);
}

function promoteProvider(provider: string): void {
  providerOrder = [provider, ...providerOrder.filter((p) => p !== provider)];
}

function demoteProvider(provider: string): void {
  providerOrder = [...providerOrder.filter((p) => p !== provider), provider];
}

function decodeSavetube(enc: string): Record<string, unknown> {
  const keyHex = process.env.YT_SAVETUBE_SECRET_KEY || SAVETUBE_KEY_DEFAULT;
  const key = Buffer.from(keyHex, "hex");
  const data = Buffer.from(enc, "base64");
  if (data.length < 16) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);

  const iv = data.subarray(0, 16);
  const content = data.subarray(16);
  const decipher = createDecipheriv("aes-128-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);

  return JSON.parse(decrypted.toString("utf8")) as Record<string, unknown>;
}

async function processWithFfmpeg(input: Buffer, kind: YtFormat): Promise<Buffer> {
  const tmp = paths.tmp || tmpdir();
  await fs.mkdir(tmp, { recursive: true });
  const inputPath = path.join(tmp, `yt_in_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const outputPath = path.join(
    tmp,
    `yt_out_${Date.now()}_${Math.random().toString(36).slice(2)}.${kind === "mp3" ? "mp3" : "mp4"}`,
  );

  try {
    await fs.writeFile(inputPath, input);

    await new Promise<void>((resolve, reject) => {
      const cmd = ffmpeg(inputPath).output(outputPath);
      if (kind === "mp3") {
        cmd.noVideo().audioCodec("libmp3lame").audioBitrate("128k").audioFrequency(44100).audioChannels(2);
      } else {
        cmd
          .videoCodec("libx264")
          .outputOptions(["-preset", "fast", "-crf", "28", "-movflags", "+faststart", "-pix_fmt", "yuv420p"])
          .audioCodec("aac")
          .audioBitrate("128k")
          .audioFrequency(44100)
          .audioChannels(2);
      }
      cmd.on("end", () => resolve()).on("error", reject).run();
    });

    const output = await fs.readFile(outputPath);
    return output.length >= 1000 ? output : input;
  } catch {
    return input;
  } finally {
    await fs.rm(inputPath, { force: true }).catch(() => undefined);
    await fs.rm(outputPath, { force: true }).catch(() => undefined);
  }
}

async function downloadWithNayan(videoURL: string, format: YtFormat): Promise<YtDownloadResult> {
  const apiURL = `https://nayan-video-downloader.vercel.app/ytdown?url=${encodeURIComponent(videoURL)}`;
  const response = await fetch(apiURL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  const body = (await response.json()) as {
    status?: boolean;
    data?: {
      title?: string;
      thumb?: string;
      audio?: string;
      video?: string;
      video_hd?: string;
      channel?: string;
      quality?: unknown;
    };
  };

  if (!body.status || !body.data) {
    return { success: false, error: ErrorCode.DOWNLOAD_FAILED, source: "nayan" };
  }

  const downloadURL =
    format === "mp3" ? body.data.audio : body.data.video_hd || body.data.video;
  if (!downloadURL) return { success: false, error: ErrorCode.DOWNLOAD_FAILED, source: "nayan" };

  const buffer = await downloadBinary(downloadURL, "nayan");
  return {
    success: true,
    buffer,
    title: body.data.title,
    thumbnail: body.data.thumb,
    author: body.data.channel,
    quality: asString(body.data.quality),
    ext: format,
    size: buffer.length,
    source: "nayan",
  };
}

async function createFlvtoDownload(
  videoID: string,
  format: YtFormat,
): Promise<{ downloadURL: string; title: string; duration: string; quality: string }> {
  const referer = `https://ht.flvto.online/button?url=https://www.youtube.com/watch?v=${videoID}&fileType=${format}`;
  const response = await fetch("https://ht.flvto.online/converter", {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
      "Content-Type": "application/json",
      Origin: "https://ht.flvto.online",
      Referer: referer,
    },
    body: JSON.stringify({ id: videoID, fileType: format }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const data = (await response.json()) as {
    title?: string;
    duration?: string;
    link?: string;
    formats?: Array<{ url?: string; qualityLabel?: string; height?: number }>;
  };

  const title = asString(data.title);
  const duration = asString(data.duration);
  let downloadURL = "";
  let quality = "";

  if (format === "mp3") {
    downloadURL = asString(data.link);
  } else {
    let bestHeight = -1;
    for (const item of data.formats ?? []) {
      const urlVal = asString(item.url);
      if (!urlVal) continue;
      if (item.qualityLabel === "720p") {
        downloadURL = urlVal;
        quality = "720p";
        break;
      }
      const height = asNumber(item.height);
      if (height > bestHeight) {
        bestHeight = height;
        downloadURL = urlVal;
        quality = asString(item.qualityLabel);
      }
    }
  }

  if (!downloadURL) throw new Error(ErrorCode.DOWNLOAD_FAILED);
  return { downloadURL, title, duration, quality };
}

async function downloadWithFlvto(videoURL: string, format: YtFormat): Promise<YtDownloadResult> {
  const videoID = getYouTubeVideoID(videoURL) || (/^[a-zA-Z0-9_-]{11}$/.test(videoURL.trim()) ? videoURL.trim() : "");
  if (!videoID) return { success: false, error: ErrorCode.DOWNLOAD_INVALID_URL, source: "flvto" };

  let meta = await createFlvtoDownload(videoID, format);
  try {
    const buffer = await downloadBinary(meta.downloadURL, "flvto", {
      Referer: "https://ht.flvto.online/",
      Origin: "https://ht.flvto.online",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
    });
    return {
      success: true,
      buffer,
      title: meta.title,
      duration: meta.duration,
      quality: meta.quality,
      ext: format,
      size: buffer.length,
      source: "flvto",
    };
  } catch (error) {
    if (!String(error).toLowerCase().includes("status 404")) {
      return { success: false, error: error instanceof Error ? error.message : String(error), source: "flvto" };
    }
    meta = await createFlvtoDownload(videoID, format);
    const buffer = await downloadBinary(meta.downloadURL, "flvto", {
      Referer: "https://ht.flvto.online/",
      Origin: "https://ht.flvto.online",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
    });
    return {
      success: true,
      buffer,
      title: meta.title,
      duration: meta.duration,
      quality: meta.quality,
      ext: format,
      size: buffer.length,
      source: "flvto",
    };
  }
}

async function downloadWithYtConvert(videoURL: string, format: YtFormat): Promise<YtDownloadResult> {
  const payload: Record<string, unknown> = {
    url: videoURL,
    os: "android",
    output: { type: format === "mp3" ? "audio" : "video", format },
  };
  if (format === "mp3") payload.audio = { bitrate: "128k" };

  const convertResp = await fetch("https://hub.ytconvert.org/api/download", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
      Origin: "https://media.ytmp3.gg",
      Referer: "https://media.ytmp3.gg/",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const convertBody = (await convertResp.json()) as { statusUrl?: string };
  if (!convertBody.statusUrl) {
    return { success: false, error: ErrorCode.DOWNLOAD_FAILED, source: "ytconvert" };
  }

  let downloadURL = "";
  let title = "";
  let duration = "";

  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    const statusResp = await fetch(convertBody.statusUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
        Referer: "https://media.ytmp3.gg/",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const status = (await statusResp.json()) as {
      status?: string;
      title?: string;
      duration?: string;
      downloadUrl?: string;
      error?: string;
      message?: string;
    };

    if (status.status === "completed") {
      downloadURL = asString(status.downloadUrl);
      title = asString(status.title);
      duration = asString(status.duration);
      break;
    }
    if (status.status === "failed" || status.error) {
      return {
        success: false,
        error: `${ErrorCode.DOWNLOAD_FAILED}:${status.error || status.message || "unknown"}`,
        source: "ytconvert",
      };
    }
  }

  if (!downloadURL) return { success: false, error: ErrorCode.DOWNLOAD_TIMEOUT, source: "ytconvert" };

  const buffer = await downloadBinary(downloadURL, "ytconvert");
  return {
    success: true,
    buffer,
    title,
    duration,
    ext: format,
    size: buffer.length,
    source: "ytconvert",
  };
}

async function downloadWithNevercap(videoURL: string, format: YtFormat): Promise<YtDownloadResult> {
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
  };

  const startResp = await fetch("https://nevercap.ai/wapi/fileServer/file/file/uploadUrlOpen", {
    method: "POST",
    headers,
    body: JSON.stringify({ url: videoURL, parentId: -1 }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const startData = (await startResp.json()) as { success?: boolean; data?: { id?: number } };
  const id = asNumber(startData.data?.id);
  if (!startData.success || !id) {
    return { success: false, error: ErrorCode.DOWNLOAD_FAILED, source: "nevercap" };
  }

  let fileURL = "";
  let fileName = "";
  let fileType = "";

  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    const checkResp = await fetch("https://nevercap.ai/wapi/fileServer/file/file/uploadUrlStatusOpen", {
      method: "POST",
      headers,
      body: JSON.stringify({ id }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const checkData = (await checkResp.json()) as {
      data?: { fileMetaInfo?: { fileUrl?: string; fileName?: string; fileType?: string } };
    };
    const meta = checkData.data?.fileMetaInfo;
    if (meta?.fileUrl) {
      fileURL = asString(meta.fileUrl);
      fileName = asString(meta.fileName);
      fileType = asString(meta.fileType);
      break;
    }
  }

  if (!fileURL) return { success: false, error: ErrorCode.DOWNLOAD_TIMEOUT, source: "nevercap" };

  const buffer = await downloadBinary(fileURL, "nevercap", {
    Referer: "https://nevercap.ai/",
    Origin: "https://nevercap.ai",
  });

  let ext: YtFormat = format;
  if (fileType.includes("audio")) ext = "mp3";

  return {
    success: true,
    buffer,
    title: fileName,
    ext,
    size: buffer.length,
    source: "nevercap",
  };
}

async function downloadWithOceanSaver(videoURL: string, format: YtFormat): Promise<YtDownloadResult> {
  const formatParam = format === "mp4" ? "360" : "mp3";
  const initResp = await fetch(
    `https://p.oceansaver.in/ajax/download.php?format=${formatParam}&url=${encodeURIComponent(videoURL)}`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  const initData = (await initResp.json()) as { success?: boolean; id?: string };
  if (!initData.success || !initData.id) {
    return { success: false, error: ErrorCode.DOWNLOAD_FAILED, source: "oceansaver" };
  }

  let downloadURL = "";
  let title = "";
  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    const progResp = await fetch(`https://p.oceansaver.in/api/progress?id=${initData.id}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const progress = (await progResp.json()) as { download_url?: string; title?: string };
    if (progress.download_url) {
      downloadURL = progress.download_url;
      title = asString(progress.title);
      break;
    }
  }

  if (!downloadURL) return { success: false, error: ErrorCode.DOWNLOAD_TIMEOUT, source: "oceansaver" };

  const buffer = await downloadBinary(downloadURL, "oceansaver");
  return {
    success: true,
    buffer,
    title,
    ext: format,
    size: buffer.length,
    source: "oceansaver",
  };
}

async function downloadWithSavetube(videoURL: string, format: YtFormat): Promise<YtDownloadResult> {
  const cdnResp = await fetch("https://media.savetube.me/api/random-cdn", {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const cdnData = (await cdnResp.json()) as { cdn?: string };
  if (!cdnData.cdn) return { success: false, error: ErrorCode.DOWNLOAD_FAILED, source: "savetube" };

  const infoResp = await fetch(`https://${cdnData.cdn}/v2/info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      Referer: "https://yt.savetube.me/",
    },
    body: JSON.stringify({ url: videoURL }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const infoRaw = (await infoResp.json()) as { data?: string };
  if (!infoRaw.data) return { success: false, error: ErrorCode.DOWNLOAD_NO_DATA, source: "savetube" };

  const info = decodeSavetube(infoRaw.data);
  const quality = format === "mp4" ? "360" : "128";
  const downloadType = format === "mp4" ? "video" : "audio";

  const dlResp = await fetch(`https://${cdnData.cdn}/download`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      Referer: "https://yt.savetube.me/",
    },
    body: JSON.stringify({ downloadType, quality, key: asString(info.key) }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const dlData = (await dlResp.json()) as { data?: { downloadUrl?: string } };
  if (!dlData.data?.downloadUrl) {
    return { success: false, error: ErrorCode.DOWNLOAD_FAILED, source: "savetube" };
  }

  const buffer = await downloadBinary(dlData.data.downloadUrl, "savetube");
  return {
    success: true,
    buffer,
    title: asString(info.title),
    thumbnail: asString(info.thumbnail),
    quality,
    ext: format,
    size: buffer.length,
    source: "savetube",
  };
}

async function downloadWithBronxyshost(nomeURL: string, format: YtFormat): Promise<YtDownloadResult> {
  const endpoint = format === "mp4" ? "play_video" : "play";
  const apiURL =
    `https://api.bronxyshost.com.br/api-bronxys/${endpoint}?nome_url=` +
    `${encodeURIComponent(nomeURL)}&apikey=${encodeURIComponent(BRONXYSHOST_KEY)}`;

  const buffer = await downloadBinary(apiURL, "bronxyshost");
  return {
    success: true,
    buffer,
    title: nomeURL,
    quality: format === "mp4" ? "video" : "audio",
    ext: format,
    size: buffer.length,
    source: "bronxyshost",
  };
}

async function downloadWithLuka(videoURL: string, format: YtFormat): Promise<YtDownloadResult> {
  if (format !== "mp3") {
    return { success: false, error: ErrorCode.DOWNLOAD_FAILED, source: "luka" };
  }

  const form = new FormData();
  form.append("url", videoURL);

  const infoResp = await fetch("https://lukavukanovic.xyz/yt-downloader/info", {
    method: "POST",
    headers: {
      Accept: "*/*",
      Origin: "https://lukavukanovic.xyz",
      Referer: "https://lukavukanovic.xyz/yt-downloader/",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36",
    },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const info = (await infoResp.json()) as { id?: string; title?: string; thumbnail?: string };
  if (!info.id) return { success: false, error: ErrorCode.DOWNLOAD_NO_DATA, source: "luka" };

  const downloadResp = await fetch("https://lukavukanovic.xyz/yt-downloader/download", {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      Origin: "https://lukavukanovic.xyz",
      Referer: "https://lukavukanovic.xyz/yt-downloader/",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36",
    },
    body: JSON.stringify({
      videoID: info.id,
      quality: "high",
      filename: info.title,
      normalize: true,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const job = (await downloadResp.json()) as { jobID?: string };
  if (!job.jobID) return { success: false, error: ErrorCode.DOWNLOAD_NO_DATA, source: "luka" };

  const eventsResp = await fetch(
    `https://lukavukanovic.xyz/yt-downloader/events?id=${encodeURIComponent(job.jobID)}`,
    {
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        Referer: "https://lukavukanovic.xyz/yt-downloader/",
        Origin: "https://lukavukanovic.xyz",
      },
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS * 2),
    },
  );

  if (!eventsResp.ok || !eventsResp.body) {
    return { success: false, error: `events status ${eventsResp.status}`, source: "luka" };
  }

  const reader = eventsResp.body.getReader();
  const decoder = new TextDecoder();
  let leftover = "";
  let filePath = "";

  while (true) {
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
        if (status === "complete" && event.filePath) {
          filePath = asString(event.filePath);
          break;
        }
        if (status === "error" || status === "failed") {
          return { success: false, error: event.error || payload, source: "luka" };
        }
      } catch {
        // ignore malformed event
      }
    }
    if (filePath) break;
  }

  if (!filePath) return { success: false, error: ErrorCode.DOWNLOAD_TIMEOUT, source: "luka" };

  const downloadURL = `https://lukavukanovic.xyz/yt-downloader/${filePath.replace(/^\//, "")}`;
  const buffer = await downloadBinary(downloadURL, "luka", {
    Referer: "https://lukavukanovic.xyz/yt-downloader/",
    Origin: "https://lukavukanovic.xyz",
  });

  return {
    success: true,
    buffer,
    title: info.title,
    thumbnail: info.thumbnail,
    ext: "mp3",
    size: buffer.length,
    source: "luka",
  };
}

type ProviderFn = (url: string, format: YtFormat) => Promise<YtDownloadResult>;

const providers: Record<string, ProviderFn> = {
  nayan: downloadWithNayan,
  flvto: downloadWithFlvto,
  ytconvert: downloadWithYtConvert,
  nevercap: downloadWithNevercap,
  oceansaver: downloadWithOceanSaver,
  savetube: downloadWithSavetube,
  bronxyshost: downloadWithBronxyshost,
  luka: downloadWithLuka,
};

/**
 * Baixa áudio/vídeo do YouTube com fila rotativa de providers + fallback.
 */
export async function downloadYouTube(videoURL: string, format: YtFormat): Promise<YtDownloadResult> {
  let lastError = "";

  for (const providerName of [...providerOrder]) {
    if (isProviderInCooldown(providerName)) continue;
    const provider = providers[providerName];
    if (!provider) continue;

    let result: YtDownloadResult | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await sleep(2000);
      try {
        result = await provider(videoURL, format);
      } catch (error) {
        result = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          source: providerName,
        };
      }
      if (result.success) break;
      lastError = result.error ?? ErrorCode.DOWNLOAD_FAILED;
    }

    if (result?.success && result.buffer) {
      resetProviderFailures(providerName);
      promoteProvider(providerName);

      const processed = await processWithFfmpeg(result.buffer, format);
      return {
        ...result,
        buffer: processed,
        size: processed.length,
      };
    }

    recordProviderFailure(providerName);
    demoteProvider(providerName);
  }

  return {
    success: false,
    error: `${ErrorCode.DOWNLOAD_FAILED}:${lastError}`,
  };
}

function navigateJSON(data: unknown, ...keys: string[]): unknown {
  let current: unknown = data;
  for (const key of keys) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function parseDurationStr(s: string): number {
  const parts = s.split(":").map((p) => Number(p) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function parseViewsStr(s: string): number {
  const cleaned = s
    .toLowerCase()
    .replace(" visualizações", "")
    .replace(" views", "")
    .replace(/\./g, "")
    .replace(/,/g, "")
    .trim();
  return Number(cleaned.replace(/[^\d]/g, "")) || 0;
}

/**
 * Pesquisa o primeiro vídeo no YouTube via scraping de ytInitialData.
 */
export async function searchYouTube(query: string): Promise<YtSearchResult> {
  const trimmed = query.trim();
  const cacheKey = `ytsearch:${trimmed.toLowerCase()}`;
  const cached = getCache<YtSearchResult>(cacheKey);
  if (cached) return cached;

  const searchURL = `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmed)}`;
  const response = await fetch(searchURL, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(30_000),
  });

  const html = await response.text();
  let match = /var ytInitialData = (\{.*?\});/s.exec(html);
  if (!match) match = /ytInitialData\s*=\s*(\{.*?\});/s.exec(html);
  if (!match?.[1]) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);

  const data = JSON.parse(match[1]) as unknown;
  const contents = navigateJSON(
    data,
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
      const videoRenderer = navigateJSON(item, "videoRenderer") as Record<string, unknown> | undefined;
      if (!videoRenderer) continue;

      const videoId = asString(videoRenderer.videoId);
      if (!videoId) continue;

      const titleRuns = navigateJSON(videoRenderer, "title", "runs");
      const title =
        Array.isArray(titleRuns) && titleRuns[0] && typeof titleRuns[0] === "object"
          ? asString((titleRuns[0] as { text?: string }).text)
          : "";

      const thumbs = navigateJSON(videoRenderer, "thumbnail", "thumbnails");
      let thumbnail = "";
      if (Array.isArray(thumbs) && thumbs.length > 0) {
        const last = thumbs[thumbs.length - 1] as { url?: string };
        thumbnail = asString(last.url);
      }

      const durationStr = asString(navigateJSON(videoRenderer, "lengthText", "simpleText"));
      const viewsStr = asString(navigateJSON(videoRenderer, "viewCountText", "simpleText"));
      const ago = asString(navigateJSON(videoRenderer, "publishedTimeText", "simpleText"));

      let author = "";
      const ownerRuns = navigateJSON(videoRenderer, "ownerText", "runs");
      if (Array.isArray(ownerRuns) && ownerRuns[0] && typeof ownerRuns[0] === "object") {
        author = asString((ownerRuns[0] as { text?: string }).text);
      }

      const result: YtSearchResult = {
        videoId,
        url: `https://youtube.com/watch?v=${videoId}`,
        title,
        thumbnail,
        duration: parseDurationStr(durationStr),
        durationStr,
        views: parseViewsStr(viewsStr),
        viewsStr,
        author,
        ago,
      };

      setCache(cacheKey, result);
      return result;
    }
  }

  throw new Error(ErrorCode.DOWNLOAD_NOT_FOUND);
}

/**
 * Resolve query (URL ou termo) para URL canônica + metadados de search quando possível.
 */
export async function resolveYouTubeTarget(query: string): Promise<{
  videoURL: string;
  search?: YtSearchResult;
}> {
  const trimmed = query.trim();

  if (isYouTubeURL(trimmed)) {
    const videoId = getYouTubeVideoID(trimmed);
    if (!videoId) throw new Error(ErrorCode.INVALID_URL);
    const videoURL = `https://youtube.com/watch?v=${videoId}`;
    try {
      const search = await searchYouTube(trimmed);
      return { videoURL, search };
    } catch {
      return { videoURL };
    }
  }

  const search = await searchYouTube(trimmed);
  return { videoURL: search.url, search };
}
