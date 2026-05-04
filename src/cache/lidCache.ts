/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import { paths } from "../config/paths.js";

const DEBOUNCE_MS = 2000;

class LIDCache {
  private store = new Map<string, string>();
  private loaded = false;
  private saveTimer: NodeJS.Timeout | null = null;

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush(), DEBOUNCE_MS);
  }

  private async flush(): Promise<void> {
    const obj = Object.fromEntries(this.store);
    await fs.mkdir(paths.cache, { recursive: true });
    await fs.writeFile(paths.lidCache, JSON.stringify(obj), "utf8");
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const raw = await fs.readFile(paths.lidCache, "utf8");
      const obj = JSON.parse(raw) as Record<string, string>;
      for (const [pn, lid] of Object.entries(obj)) this.store.set(pn, lid);
    } catch {
      // arquivo ainda nao existe, comeca vazio
    }
  }

  get(pn: string): string | null {
    return this.store.get(pn) ?? null;
  }

  set(pn: string, lid: string): void {
    if (this.store.get(pn) === lid) return;
    this.store.set(pn, lid);
    this.scheduleSave();
  }
}

export const lidCache = new LIDCache();
