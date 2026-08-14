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

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov"]);

type MediaHit = { type: "image" | "video"; relativePath: string };

let maleTexts: Record<string, string> | null = null;
let femaleTexts: Record<string, string> | null = null;
let rankHeaders: Record<string, string> | null = null;
const sectionIndex = new Map<string, Map<string, MediaHit>>();

function loadJson<T>(fileName: string): T {
  return require(path.join(funDir, fileName)) as T;
}

function ensureTextsLoaded(): void {
  if (!maleTexts) maleTexts = loadJson("gamestext.json");
  if (!femaleTexts) femaleTexts = loadJson("gamestext2.json");
  if (!rankHeaders) rankHeaders = loadJson("ranks.json");
}

async function indexSection(section: "games" | "ranks" | "games2"): Promise<Map<string, MediaHit>> {
  const cached = sectionIndex.get(section);
  if (cached) return cached;

  const map = new Map<string, MediaHit>();
  const dir = path.join(funDir, section);
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    sectionIndex.set(section, map);
    return map;
  }

  for (const fileName of entries) {
    const ext = path.extname(fileName).toLowerCase();
    const base = path.basename(fileName, path.extname(fileName));
    if (!base) continue;

    let type: "image" | "video" | null = null;
    if (IMAGE_EXTS.has(ext)) type = "image";
    else if (VIDEO_EXTS.has(ext)) type = "video";
    if (!type) continue;

    map.set(base, { type, relativePath: path.join(section, fileName) });
  }

  sectionIndex.set(section, map);
  return map;
}

async function lookupKey(
  section: "games" | "ranks" | "games2",
  key: string,
): Promise<MediaHit | undefined> {
  if (!key) return undefined;
  return (await indexSection(section)).get(key);
}

export function formatFunTemplate(template: string, nome: string, level: string | number): string {
  return template.replaceAll("#nome#", nome).replaceAll("#level#", String(level));
}

export function getPercentText(trait: string, nome: string, level: number, fallback: string): string {
  ensureTextsLoaded();
  const template = maleTexts?.[trait] ?? femaleTexts?.[trait];
  if (!template) return fallback;
  return formatFunTemplate(template, nome, level);
}

export function getRankHeader(commandName: string, fallback: string): string {
  ensureTextsLoaded();
  return rankHeaders?.[commandName] ?? fallback;
}

async function resolveEntry(
  section: "games" | "ranks" | "games2",
  key: string,
): Promise<MediaHit | undefined> {
  if (section === "games") {
    return (await lookupKey("games", key)) ?? (await lookupKey("games", GAMES_MEDIA_FALLBACKS[key] ?? ""));
  }

  if (section === "ranks") {
    const fallback = RANKS_MEDIA_FALLBACKS[key];
    const direct = await lookupKey("ranks", key);
    if (direct) return direct;
    if (fallback) {
      const fallbackHit = await lookupKey("ranks", fallback);
      if (fallbackHit) return fallbackHit;
    }
    const trait = key.replace(/^rank/, "");
    return (await lookupKey("games", trait)) ?? (await lookupKey("games", GAMES_MEDIA_FALLBACKS[trait] ?? ""));
  }

  const mediaKey = GAMES2_MEDIA_KEYS[key] ?? key;
  return (await lookupKey("games2", mediaKey)) ?? (await lookupKey("games2", key));
}

export async function resolveFunMediaPath(
  section: "games" | "ranks" | "games2",
  key: string,
): Promise<{ type: "image" | "video"; absolutePath: string } | null> {
  const entry = await resolveEntry(section, key);
  if (!entry) return null;
  return { type: entry.type, absolutePath: path.join(funDir, entry.relativePath) };
}

export async function readFunMedia(
  section: "games" | "ranks" | "games2",
  key: string,
): Promise<{ type: "image" | "video"; buffer: Buffer } | null> {
  const resolved = await resolveFunMediaPath(section, key);
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
export async function countPercentTraitsWithMedia(traits: string[]): Promise<{ withMedia: number; total: number }> {
  let withMedia = 0;
  for (const trait of traits) {
    if (await resolveEntry("games", trait)) withMedia += 1;
  }
  return { withMedia, total: traits.length };
}
