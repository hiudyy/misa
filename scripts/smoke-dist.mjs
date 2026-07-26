import { constants, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const i18n = await import(pathToFileURL(path.join(dist, "i18n", "index.js")).href);
const { paths } = await import(pathToFileURL(path.join(dist, "config", "paths.js")).href);
const { CommandHandler } = await import(pathToFileURL(path.join(dist, "handlers", "commandHandler.js")).href);
const { CURRENT_CONFIG_SCHEMA_VERSION } = await import(pathToFileURL(path.join(dist, "config", "migrations.js")).href);
const packageInfo = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));

for (const locale of i18n.SUPPORTED_LOCALES) {
  await fs.access(path.join(dist, "i18n", `${locale}.json`), constants.R_OK);
  const translated = i18n.t("commands.ping.latency", locale);
  if (!translated || translated === "commands.ping.latency") {
    throw new Error(`DIST_LOCALE_INVALID:${locale}`);
  }
}

await fs.access(path.join(dist, "assets", "menu.jpeg"), constants.R_OK);
if (paths.root !== root) throw new Error(`DIST_ROOT_INVALID:${paths.root}`);
if (paths.botConfig !== path.join(root, "dados", "config.json")) throw new Error("DIST_CONFIG_PATH_INVALID");
if (paths.commands !== path.join(dist, "commands")) throw new Error("DIST_COMMAND_PATH_INVALID");
if (paths.assets !== path.join(dist, "assets")) throw new Error("DIST_ASSET_PATH_INVALID");
if (packageInfo.version !== "1.0.0") throw new Error(`DIST_VERSION_INVALID:${packageInfo.version}`);
if (CURRENT_CONFIG_SCHEMA_VERSION !== 1) throw new Error(`DIST_SCHEMA_INVALID:${CURRENT_CONFIG_SCHEMA_VERSION}`);
await fs.access(path.join(root, "docs", "en", "architecture.md"), constants.R_OK);
await fs.access(path.join(root, "docs", "pt", "installation.md"), constants.R_OK);

const commands = new CommandHandler();
await commands.loadCommands(paths.commands);
if (commands.listUnique().length === 0 || !commands.get("ping")) throw new Error("DIST_COMMANDS_INVALID");

console.log(`dist smoke passed: ${i18n.SUPPORTED_LOCALES.length} locales, ${commands.listUnique().length} commands`);
