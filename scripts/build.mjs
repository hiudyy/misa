import { promises as fs } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

await fs.rm(dist, { force: true, recursive: true });

const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");
const result = spawnSync(process.execPath, [tsc], { cwd: root, stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);

await fs.mkdir(path.join(dist, "i18n"), { recursive: true });
const localeFiles = (await fs.readdir(path.join(root, "src", "i18n")))
  .filter((file) => file.endsWith(".json"));
await Promise.all(localeFiles.map((file) => fs.copyFile(
  path.join(root, "src", "i18n", file),
  path.join(dist, "i18n", file),
)));
await fs.cp(path.join(root, "src", "assets"), path.join(dist, "assets"), { recursive: true });
