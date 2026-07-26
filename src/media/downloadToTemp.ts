/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { paths } from "../config/paths.js";
import { ErrorCode } from "../helpers/localizeError.js";
import { metrics } from "../metrics.js";
import { getMediaLimit, type MediaKind, type TempMedia } from "./types.js";

type DownloadOptions = {
  url: string;
  kind: MediaKind;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
  tempDir?: string;
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/ogg": ".ogg",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "application/vnd.android.package-archive": ".apk",
};

function assertHttpUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(ErrorCode.DOWNLOAD_INVALID_URL);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(ErrorCode.DOWNLOAD_INVALID_URL);
  return url;
}

function parseContentLength(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function isClearlyNotMedia(contentType: string): boolean {
  const normalized = contentType.toLowerCase();
  return normalized.startsWith("text/")
    || normalized.includes("json")
    || normalized.includes("xml")
    || normalized.includes("html");
}

function extensionFor(contentType: string, url: URL): string {
  const normalized = contentType.split(";")[0].trim().toLowerCase();
  const known = EXTENSIONS[normalized];
  if (known) return known;
  const extension = path.extname(url.pathname);
  return /^\.[a-z0-9]{1,7}$/i.test(extension) ? extension : ".bin";
}

function combinedSignal(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function kindFromContentType(contentType: string, fallback: MediaKind): MediaKind {
  if (fallback === "sticker") return fallback;
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("video/")) return "video";
  return fallback;
}

export function assertMediaSize(size: number | { toString(): string } | null | undefined, kind: MediaKind): void {
  if (size == null) return;
  const numeric = typeof size === "number" ? size : Number(size.toString());
  if (Number.isFinite(numeric) && numeric > getMediaLimit(kind)) {
    throw new Error(ErrorCode.MEDIA_DOWNLOAD_TOO_LARGE);
  }
}

export async function downloadToTemp(options: DownloadOptions): Promise<TempMedia> {
  const url = assertHttpUrl(options.url);
  const fetchImpl = options.fetchImpl ?? fetch;
  const signal = combinedSignal(options.signal, options.timeoutMs ?? 180_000);
  const response = await fetchImpl(url, {
    headers: options.headers,
    signal,
    redirect: "follow",
  });

  if (!response.ok) throw new Error(`${ErrorCode.DOWNLOAD_FAILED}:HTTP_${response.status}`);
  if (!response.body) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);

  const contentType = (response.headers.get("content-type") ?? "application/octet-stream").split(";")[0].trim();
  if (isClearlyNotMedia(contentType)) throw new Error(ErrorCode.DOWNLOAD_FAILED);
  const kind = kindFromContentType(contentType, options.kind);
  const maxBytes = options.maxBytes ?? getMediaLimit(kind);
  const announced = parseContentLength(response.headers.get("content-length"));
  if (announced !== null && announced > maxBytes) throw new Error(ErrorCode.MEDIA_DOWNLOAD_TOO_LARGE);

  const directory = options.tempDir ?? paths.tmp;
  await fs.mkdir(directory, { recursive: true });
  const filePath = path.join(directory, `media_${randomUUID()}${extensionFor(contentType, url)}`);
  const handle = await fs.open(filePath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
  let size = 0;
  let completed = false;

  try {
    for await (const chunk of response.body) {
      if (signal.aborted) throw signal.reason ?? new Error(ErrorCode.MEDIA_ABORTED);
      const buffer = Buffer.from(chunk);
      size += buffer.length;
      if (size > maxBytes) throw new Error(ErrorCode.MEDIA_DOWNLOAD_TOO_LARGE);
      await handle.write(buffer);
    }
    if (size === 0) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);
    await handle.sync();
    completed = true;
  } catch (error) {
    if (signal.aborted) {
      const reason = signal.reason;
      if (reason instanceof Error && reason.name === "TimeoutError") {
        throw new Error(ErrorCode.DOWNLOAD_TIMEOUT);
      }
      if (reason instanceof Error) throw reason;
      throw new Error(ErrorCode.MEDIA_ABORTED);
    }
    throw error;
  } finally {
    await handle.close().catch(() => undefined);
    if (!completed) await fs.rm(filePath, { force: true }).catch(() => undefined);
  }

  metrics.addMediaBytes(size);
  let cleaned = false;
  return {
    path: filePath,
    size,
    contentType,
    kind,
    async cleanup() {
      if (cleaned) return;
      cleaned = true;
      await fs.rm(filePath, { force: true });
    },
  };
}
