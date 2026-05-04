/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { WASocket } from "baileys";
import { log } from "../logger.js";
import { Event } from "../types/Event.js";

export class EventHandler {
  async loadEvents(eventsDir: string, misa: WASocket): Promise<void> {
    const files = await this.walkDir(eventsDir);
    const eventFiles = files.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of eventFiles) {
      const imported = await import(pathToFileURL(path.resolve(file)).href);
      const event: Event | undefined = imported.default ?? imported.event;

      if (!event?.event || !event?.execute) {
        log.warn("EVENT", `Ignorado porque esta invalido: ${file}`);
        continue;
      }

      misa.ev.on(event.event as never, async (data: unknown) => {
        try {
          await event.execute({ misa, data });
        } catch (error) {
          log.error("EVENT", `Erro em ${event.name}.`, error);
        }
      });
    }
  }

  private async walkDir(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          return this.walkDir(fullPath);
        }

        return [fullPath];
      }),
    );

    return files.flat();
  }
}
