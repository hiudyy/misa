/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
const VIDEO_ID_RE =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

export const YOUTUBE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function getYouTubeVideoID(urlStr: string): string {
  return VIDEO_ID_RE.exec(urlStr)?.[1] ?? "";
}

export function isYouTubeURL(urlStr: string): boolean {
  try {
    const hostname = new URL(urlStr).hostname.toLowerCase();
    return hostname === "youtu.be" || hostname === "youtube.com" || hostname.endsWith(".youtube.com");
  } catch {
    return false;
  }
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

export function asString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function navigateJSON(data: unknown, ...keys: string[]): unknown {
  let current: unknown = data;
  for (const key of keys) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function parseDurationString(value: string): number {
  const parts = value.split(":").map((part) => Number(part) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export function parseViewsString(value: string): number {
  const cleaned = value
    .toLowerCase()
    .replace(" visualizações", "")
    .replace(" views", "")
    .replace(/\./g, "")
    .replace(/,/g, "")
    .trim();
  return Number(cleaned.replace(/[^\d]/g, "")) || 0;
}
