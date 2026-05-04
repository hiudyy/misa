/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { log } from "../logger.js";
import { Command } from "../types/Command.js";

export class CommandHandler {
  private readonly commands = new Map<string, Command>();

  async loadCommands(commandsDir: string): Promise<void> {
    const files = await this.walkDir(commandsDir);
    const commandFiles = files.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of commandFiles) {
      const imported = await import(pathToFileURL(path.resolve(file)).href);
      const command: Command | undefined = imported.default ?? imported.command;

      if (!command?.execute) {
        log.warn("COMMAND", `Ignorado porque esta invalido: ${file}`);
        continue;
      }

      const fallbackName = path.basename(file, path.extname(file));
      const commandName = (command.name || fallbackName).toLowerCase();

      this.commands.set(commandName, { ...command, name: commandName });

      for (const alias of command.aliases ?? []) {
        this.commands.set(alias.toLowerCase(), { ...command, name: commandName });
      }

    }
  }

  get(commandName: string): Command | undefined {
    return this.commands.get(commandName.toLowerCase());
  }

  listUnique(): Command[] {
    const unique = new Map<string, Command>();

    for (const command of this.commands.values()) {
      if (!unique.has(command.name)) {
        unique.set(command.name, command);
      }
    }

    return [...unique.values()];
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
