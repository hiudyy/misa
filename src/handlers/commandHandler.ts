/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { SUPPORTED_LOCALES, createTranslator, getGlobalLocale, t } from "../i18n/index.js";
import { log } from "../logger.js";
import { Command } from "../types/Command.js";

export class CommandHandler {
  private readonly commands = new Map<string, Command>();

  async loadCommands(commandsDir: string): Promise<void> {
    const globalLocale = await getGlobalLocale();
    const globalT = createTranslator(globalLocale);
    const files = await this.walkDir(commandsDir);
    const commandFiles = files.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of commandFiles) {
      const imported = await import(pathToFileURL(path.resolve(file)).href);
      const command: Command | undefined = imported.default ?? imported.command;

      if (!command?.execute) {
        log.warn("COMMAND", globalT("logs.commandInvalid", { file }));
        continue;
      }

      const fallbackName = path.basename(file, path.extname(file));
      const commandName = (command.name || fallbackName).toLowerCase();
      const normalizedCommand = { ...command, name: commandName };
      this.commands.set(commandName, normalizedCommand);

      for (const alias of this.collectAliases(command)) {
        this.commands.set(alias, normalizedCommand);
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
