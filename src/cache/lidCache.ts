/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { paths } from "../config/paths.js";
import { readJson, writeJson } from "../storage/jsonStore.js";

const DEBOUNCE_MS = 2000;
const MAX_LID_CACHE_SIZE = 50_000;
const LID_CACHE_EVICT_COUNT = 1_000;

class LIDCache {
  private store = new Map<string, string>();
  private loaded = false;
  private saveTimer: NodeJS.Timeout | null = null;

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush().catch(() => undefined), DEBOUNCE_MS);
  }

  /** Remove as entradas mais antigas (FIFO) quando o cache excede o limite. */
  private evictIfNeeded(): void {
    if (this.store.size <= MAX_LID_CACHE_SIZE) return;
    const keys = this.store.keys();
    for (let i = 0; i < LID_CACHE_EVICT_COUNT; i++) {
      const key = keys.next().value;
      if (key === undefined) break;
      this.store.delete(key);
    }
  }

  async flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    const obj = Object.fromEntries(this.store);
    await writeJson(paths.lidCache, obj);
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    const obj = await readJson(paths.lidCache, {
      defaultValue: {} as Record<string, string>,
      normalize(value) {
        if (typeof value !== "object" || value === null) return {};
        return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
      },
    });
    for (const [pn, lid] of Object.entries(obj)) this.store.set(pn, lid);
  }

  get(pn: string): string | null {
    return this.store.get(pn) ?? null;
  }

  set(pn: string, lid: string): void {
    if (this.store.get(pn) === lid) return;
    this.store.set(pn, lid);
    this.evictIfNeeded();
    this.scheduleSave();
  }
}

export const lidCache = new LIDCache();
