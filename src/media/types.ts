/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
export type MediaKind = "image" | "audio" | "video" | "document" | "sticker";

export const MEDIA_LIMITS: Record<MediaKind, number> = {
  image: 20 * 1024 * 1024,
  audio: 40 * 1024 * 1024,
  video: 80 * 1024 * 1024,
  document: 80 * 1024 * 1024,
  sticker: 20 * 1024 * 1024,
};

export function getMediaLimit(kind: MediaKind): number {
  return MEDIA_LIMITS[kind];
}

export function configureMediaLimits(limitsMiB: Record<MediaKind, number>): void {
  for (const kind of Object.keys(MEDIA_LIMITS) as MediaKind[]) {
    MEDIA_LIMITS[kind] = limitsMiB[kind] * 1024 * 1024;
  }
}

export type TempMedia = {
  path: string;
  size: number;
  contentType: string;
  kind: MediaKind;
  cleanup: () => Promise<void>;
};
