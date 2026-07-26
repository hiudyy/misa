/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { SUPPORTED_LOCALES, t } from "../i18n/index.js";
import { COMMAND_CATEGORIES, Command } from "../types/Command.js";

type RegisteredCommand = {
  command: Command;
  file: string;
};

function isToken(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim()) && !/\s/.test(value);
}

function assertCommand(value: unknown, file: string): asserts value is Command {
  if (typeof value !== "object" || value === null) throw new Error(`COMMAND_INVALID:${file}:object`);
  const command = value as Record<string, unknown>;
  if (!isToken(command.name)) throw new Error(`COMMAND_INVALID:${file}:name`);
  if (typeof command.description !== "string" || !command.description.trim()) {
    throw new Error(`COMMAND_INVALID:${file}:description`);
  }
  if (typeof command.category !== "string" || !COMMAND_CATEGORIES.includes(command.category as Command["category"])) {
    throw new Error(`COMMAND_INVALID:${file}:category:${String(command.category)}`);
  }
  if (typeof command.execute !== "function") throw new Error(`COMMAND_INVALID:${file}:execute`);

  for (const flag of ["ownerOnly", "groupOnly", "privateOnly", "adminOnly", "botAdminRequired"] as const) {
    if (command[flag] !== undefined && typeof command[flag] !== "boolean") {
      throw new Error(`COMMAND_INVALID:${file}:${flag}`);
    }
  }

  if (command.aliases !== undefined) {
    if (!Array.isArray(command.aliases) || !command.aliases.every(isToken)) {
      throw new Error(`COMMAND_INVALID:${file}:aliases`);
    }
  }

  if (command.i18nAliases !== undefined) {
    if (typeof command.i18nAliases !== "object" || command.i18nAliases === null) {
      throw new Error(`COMMAND_INVALID:${file}:i18nAliases`);
    }
    for (const aliases of Object.values(command.i18nAliases)) {
      if (!Array.isArray(aliases) || !aliases.every(isToken)) {
        throw new Error(`COMMAND_INVALID:${file}:i18nAliases`);
      }
    }
  }
}

export class CommandHandler {
  private readonly commands = new Map<string, Command>();

  async loadCommands(commandsDir: string): Promise<void> {
    const files = await this.walkDir(commandsDir);
    const commandFiles = files
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
      .sort((a, b) => a.localeCompare(b));
    const registry = new Map<string, RegisteredCommand>();

    for (const file of commandFiles) {
      const imported = await import(pathToFileURL(path.resolve(file)).href);
      const raw = imported.default ?? imported.command ?? imported.commands;
      const list: Command[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

      if (list.length === 0) {
        throw new Error(`COMMAND_INVALID:${file}:export`);
      }

      for (const command of list) {
        assertCommand(command, file);
        const commandName = command.name.trim().toLowerCase();
        const normalizedCommand = { ...command, name: commandName };
        this.register(registry, commandName, normalizedCommand, file);

        for (const alias of this.collectAliases(command)) {
          this.register(registry, alias, normalizedCommand, file);
        }
      }
    }

    this.commands.clear();
    for (const [token, registered] of registry) this.commands.set(token, registered.command);
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

  listNames(): string[] {
    return [...this.commands.keys()];
  }

  private collectAliases(command: Command): string[] {
    const aliases = new Set<string>();

    for (const alias of command.aliases ?? []) {
      const normalized = alias.trim().toLowerCase();
      if (normalized) aliases.add(normalized);
    }

    for (const localeAliases of Object.values(command.i18nAliases ?? {})) {
      for (const alias of localeAliases ?? []) {
        const normalized = alias.trim().toLowerCase();
        if (normalized) aliases.add(normalized);
      }
    }

    for (const locale of SUPPORTED_LOCALES) {
      const translatedName = t(`commands.menu.cmds.${command.name}`, locale).trim().toLowerCase();
      if (translatedName && translatedName !== `commands.menu.cmds.${command.name}`) {
        aliases.add(translatedName);
      }
    }

    aliases.delete(command.name.toLowerCase());
    return [...aliases];
  }

  private register(registry: Map<string, RegisteredCommand>, token: string, command: Command, file: string): void {
    const normalized = token.trim().toLowerCase();
    const existing = registry.get(normalized);
    if (!existing) {
      registry.set(normalized, { command, file });
      return;
    }
    if (existing.command === command) return;
    throw new Error(
      `COMMAND_COLLISION:${normalized}:${existing.command.name}:${existing.file}:${command.name}:${file}`,
    );
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
