/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import {
  GAMES2_MEDIA_KEYS,
  GAMES_MEDIA_FALLBACKS,
  RANKS_MEDIA_FALLBACKS,
} from "./funMediaFallbacks.js";

const require = createRequire(import.meta.url);
const funDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "fun");

type MediaEntry = {
  image?: { path: string };
  video?: { path: string };
};

type MediaManifest = {
  games: Record<string, MediaEntry>;
  ranks: Record<string, MediaEntry>;
  games2: Record<string, MediaEntry>;
};

let maleTexts: Record<string, string> | null = null;
let femaleTexts: Record<string, string> | null = null;
let rankHeaders: Record<string, string> | null = null;
let media: MediaManifest | null = null;

function loadJson<T>(fileName: string): T {
  return require(path.join(funDir, fileName)) as T;
}

function ensureLoaded(): void {
  if (!maleTexts) maleTexts = loadJson("gamestext.json");
  if (!femaleTexts) femaleTexts = loadJson("gamestext2.json");
  if (!rankHeaders) rankHeaders = loadJson("ranks.json");
  if (!media) media = loadJson("games.media.json");
}

export function formatFunTemplate(template: string, nome: string, level: string | number): string {
  return template.replaceAll("#nome#", nome).replaceAll("#level#", String(level));
}

export function getPercentText(trait: string, nome: string, level: number, fallback: string): string {
  ensureLoaded();
  const template = maleTexts?.[trait] ?? femaleTexts?.[trait];
  if (!template) return fallback;
  return formatFunTemplate(template, nome, level);
}

export function getRankHeader(commandName: string, fallback: string): string {
  ensureLoaded();
  return rankHeaders?.[commandName] ?? fallback;
}

function resolveEntry(
  section: "games" | "ranks" | "games2",
  key: string,
): MediaEntry | undefined {
  ensureLoaded();
  if (!media) return undefined;

  if (section === "games") {
    return media.games[key] ?? media.games[GAMES_MEDIA_FALLBACKS[key] ?? ""];
  }

  if (section === "ranks") {
    const fallback = RANKS_MEDIA_FALLBACKS[key];
    if (media.ranks[key]) return media.ranks[key];
    if (fallback && media.ranks[fallback]) return media.ranks[fallback];
    // ranks sem arte própria: tenta imagem do trait base em games
    const trait = key.replace(/^rank/, "");
    return media.games[trait] ?? media.games[GAMES_MEDIA_FALLBACKS[trait] ?? ""];
  }

  const mediaKey = GAMES2_MEDIA_KEYS[key] ?? key;
  return media.games2[mediaKey] ?? media.games2[key];
}

export function resolveFunMediaPath(
  section: "games" | "ranks" | "games2",
  key: string,
): { type: "image" | "video"; absolutePath: string } | null {
  const entry = resolveEntry(section, key);
  if (!entry) return null;

  if (entry.image?.path) {
    return { type: "image", absolutePath: path.join(funDir, entry.image.path) };
  }
  if (entry.video?.path) {
    return { type: "video", absolutePath: path.join(funDir, entry.video.path) };
  }
  return null;
}

export async function readFunMedia(
  section: "games" | "ranks" | "games2",
  key: string,
): Promise<{ type: "image" | "video"; buffer: Buffer } | null> {
  const resolved = resolveFunMediaPath(section, key);
  if (!resolved) return null;

  try {
    const buffer = await fs.readFile(resolved.absolutePath);
    if (buffer.length < 100) return null;
    return { type: resolved.type, buffer };
  } catch {
    return null;
  }
}

/** Quantos traits de porcentagem resolvem para alguma mídia local (direto ou fallback). */
export function countPercentTraitsWithMedia(traits: string[]): { withMedia: number; total: number } {
  ensureLoaded();
  let withMedia = 0;
  for (const trait of traits) {
    if (resolveEntry("games", trait)) withMedia += 1;
  }
  return { withMedia, total: traits.length };
}
